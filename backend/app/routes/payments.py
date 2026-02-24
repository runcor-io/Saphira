"""
Payment router for handling credit purchases.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_async_db
from app.models.user import User
from app.schemas.payment import (
    PaymentInitializeRequest,
    PaymentInitializeResponse,
    PaymentListResponse,
    PaymentResponse,
    PaymentVerifyResponse,
    PaystackWebhookPayload,
    TransactionHistoryResponse,
)
from app.services.credit_service import CreditService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/initialize",
    response_model=PaymentInitializeResponse,
    summary="Initialize payment",
    description="Initialize a payment transaction for credit purchase."
)
async def initialize_payment(
    request: PaymentInitializeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> PaymentInitializeResponse:
    """
    Initialize a payment for credit purchase.
    
    - **package_slug**: The slug of the credit package to purchase
    - **email**: Optional override for user's email
    - **callback_url**: Optional URL to redirect after payment
    
    Returns authorization URL to redirect the user to Paystack.
    """
    payment_service = PaymentService(db)
    
    # Use user's email if not provided
    email = request.email or current_user.email
    
    try:
        result = await payment_service.initialize_payment(
            user_id=current_user.id,
            email=email,
            package_slug=request.package_slug,
            callback_url=request.callback_url,
        )
        
        return PaymentInitializeResponse(
            authorization_url=result["authorization_url"],
            access_code=result["access_code"],
            reference=result["reference"],
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment initialization failed: {str(e)}",
        )


@router.get(
    "/verify/{reference}",
    response_model=PaymentVerifyResponse,
    summary="Verify payment",
    description="Verify a payment transaction and add credits if successful."
)
async def verify_payment(
    reference: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> PaymentVerifyResponse:
    """
    Verify a payment and add credits if successful.
    
    - **reference**: The payment reference from Paystack
    
    Returns verification result and new credit balance if successful.
    """
    payment_service = PaymentService(db)
    credit_service = CreditService(db)
    
    try:
        success, payment = await payment_service.verify_payment(reference)
        
        if success:
            balance = await credit_service.get_balance(current_user.id)
            return PaymentVerifyResponse(
                success=True,
                message="Payment successful",
                payment=PaymentResponse.model_validate(payment),
                credits_added=payment.credits_purchased,
                new_balance=balance,
            )
        else:
            return PaymentVerifyResponse(
                success=False,
                message="Payment verification failed or pending",
                payment=PaymentResponse.model_validate(payment) if payment else None,
                credits_added=0,
                new_balance=await credit_service.get_balance(current_user.id),
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}",
        )


@router.get(
    "/history",
    response_model=PaymentListResponse,
    summary="Get payment history",
    description="Get the payment history for the authenticated user."
)
async def get_payment_history(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> PaymentListResponse:
    """
    Get payment history.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of payments per page (default: 20)
    """
    payment_service = PaymentService(db)
    payments, total_count = await payment_service.get_user_payments(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )
    
    return PaymentListResponse(
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Paystack webhook",
    description="Handle Paystack webhook events."
)
async def paystack_webhook(
    request: Request,
    db: AsyncSession = Depends(get_async_db)
) -> dict:
    """
    Handle Paystack webhook events.
    
    This endpoint receives webhook events from Paystack for payment updates.
    """
    # In production, verify webhook signature
    # signature = request.headers.get("x-paystack-signature")
    
    try:
        payload = await request.json()
        payment_service = PaymentService(db)
        
        success = await payment_service.handle_webhook(payload)
        
        if success:
            return {"status": "success"}
        else:
            return {"status": "processed"}
            
    except Exception as e:
        # Log the error but return 200 to prevent Paystack retries
        # if the error is unrecoverable
        return {"status": "error", "message": str(e)}


@router.get(
    "/transaction-summary",
    response_model=TransactionHistoryResponse,
    summary="Get transaction summary",
    description="Get a summary of all payment transactions."
)
async def get_transaction_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> TransactionHistoryResponse:
    """
    Get transaction summary including total spent and credits purchased.
    """
    payment_service = PaymentService(db)
    payments, _ = await payment_service.get_user_payments(
        user_id=current_user.id,
        page=1,
        page_size=1000,  # Get all
    )
    
    # Calculate totals
    total_spent = sum(p.amount_naira for p in payments if p.status.value == "success")
    total_credits = sum(p.credits_purchased for p in payments if p.status.value == "success")
    
    return TransactionHistoryResponse(
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total_spent_naira=total_spent,
        total_credits_purchased=total_credits,
    )
