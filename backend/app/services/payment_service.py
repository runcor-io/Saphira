"""
Payment service for handling payments and credit purchases.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.credit import TransactionType
from app.models.payment import CreditPackage, Payment, PaymentStatus
from app.services.credit_service import CreditService

settings = get_settings()


class PaystackClient:
    """Paystack API client."""
    
    BASE_URL = settings.PAYSTACK_BASE_URL
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }
    
    async def initialize_transaction(
        self,
        email: str,
        amount_kobo: int,
        reference: str,
        callback_url: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> dict:
        """Initialize a payment transaction."""
        url = f"{self.BASE_URL}/transaction/initialize"
        
        payload = {
            "email": email,
            "amount": amount_kobo,
            "reference": reference,
        }
        
        if callback_url:
            payload["callback_url"] = callback_url
        if metadata:
            payload["metadata"] = metadata
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
    
    async def verify_transaction(self, reference: str) -> dict:
        """Verify a payment transaction."""
        url = f"{self.BASE_URL}/transaction/verify/{reference}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()


class PaymentService:
    """Service class for payment operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.paystack = PaystackClient()
        self.credit_service = CreditService(db)
    
    async def get_credit_package(self, slug: str) -> Optional[CreditPackage]:
        """Get credit package by slug."""
        result = await self.db.execute(
            select(CreditPackage).where(CreditPackage.slug == slug, CreditPackage.is_active == "Y")
        )
        return result.scalar_one_or_none()
    
    async def get_all_credit_packages(self) -> list[CreditPackage]:
        """Get all active credit packages."""
        result = await self.db.execute(
            select(CreditPackage)
            .where(CreditPackage.is_active == "Y")
            .order_by(CreditPackage.display_order)
        )
        return list(result.scalars().all())
    
    async def initialize_payment(
        self,
        user_id: UUID,
        email: str,
        package_slug: str,
        callback_url: Optional[str] = None,
    ) -> dict:
        """Initialize a payment for credit purchase."""
        # Get package
        package = await self.get_credit_package(package_slug)
        if not package:
            raise ValueError("Invalid package")
        
        # Generate unique reference
        reference = f"saphire_{uuid.uuid4().hex[:20]}"
        
        # Create payment record
        payment = Payment(
            user_id=user_id,
            paystack_reference=reference,
            amount_kobo=package.price_kobo,
            currency=package.currency,
            package_name=package.name,
            credits_purchased=package.total_credits,
            status=PaymentStatus.PENDING,
            customer_email=email,
            metadata_json={"package_slug": package_slug},
        )
        
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        
        # Initialize with Paystack
        try:
            paystack_response = await self.paystack.initialize_transaction(
                email=email,
                amount_kobo=package.price_kobo,
                reference=reference,
                callback_url=callback_url,
                metadata={"payment_id": str(payment.id), "user_id": str(user_id)},
            )
            
            if paystack_response.get("status"):
                return {
                    "authorization_url": paystack_response["data"]["authorization_url"],
                    "access_code": paystack_response["data"]["access_code"],
                    "reference": reference,
                }
            else:
                raise Exception("Paystack initialization failed")
                
        except Exception as e:
            # Update payment status to failed
            payment.status = PaymentStatus.FAILED
            payment.failure_message = str(e)
            await self.db.commit()
            raise
    
    async def verify_payment(self, reference: str) -> tuple[bool, Payment]:
        """
        Verify a payment and process credits if successful.
        Returns (success, payment).
        """
        # Get payment record
        result = await self.db.execute(
            select(Payment).where(Payment.paystack_reference == reference)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise ValueError("Payment not found")
        
        # If already processed, return current status
        if payment.status == PaymentStatus.SUCCESS:
            return True, payment
        
        # Verify with Paystack
        try:
            verify_response = await self.paystack.verify_transaction(reference)
            
            if verify_response.get("status"):
                data = verify_response["data"]
                gateway_status = data.get("status")
                
                if gateway_status == "success":
                    # Update payment
                    payment.status = PaymentStatus.SUCCESS
                    payment.paystack_transaction_id = str(data.get("id"))
                    payment.paid_at = datetime.now(timezone.utc)
                    payment.gateway_response = str(data)
                    
                    if data.get("channel"):
                        payment.payment_method = data.get("channel")
                    
                    await self.db.commit()
                    
                    # Add credits to user
                    await self.credit_service.add_credits(
                        user_id=payment.user_id,
                        amount=payment.credits_purchased,
                        transaction_type=TransactionType.PURCHASE,
                        description=f"Purchased {payment.package_name}",
                        payment_id=payment.id,
                        package_name=payment.package_name,
                    )
                    
                    return True, payment
                    
                elif gateway_status == "failed":
                    payment.status = PaymentStatus.FAILED
                    payment.failed_at = datetime.now(timezone.utc)
                    payment.failure_message = data.get("gateway_response", "Payment failed")
                    await self.db.commit()
                    return False, payment
            
            # Still pending or unknown status
            return False, payment
            
        except Exception as e:
            payment.status = PaymentStatus.FAILED
            payment.failure_message = str(e)
            await self.db.commit()
            raise
    
    async def get_user_payments(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Payment], int]:
        """Get user's payment history."""
        from sqlalchemy import desc, func
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).where(Payment.user_id == user_id)
        )
        total_count = count_result.scalar()
        
        # Get payments
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(desc(Payment.created_at))
            .offset(offset)
            .limit(page_size)
        )
        
        payments = list(result.scalars().all())
        return payments, total_count
    
    async def handle_webhook(self, payload: dict) -> bool:
        """Handle Paystack webhook."""
        event = payload.get("event")
        data = payload.get("data", {})
        
        if event == "charge.success":
            reference = data.get("reference")
            if reference:
                try:
                    await self.verify_payment(reference)
                    return True
                except Exception:
                    return False
        
        # Handle other events as needed
        return False
