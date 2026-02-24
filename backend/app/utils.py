"""
Utility functions for Saphire AI.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional


def generate_uuid() -> str:
    """Generate a unique UUID string."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime to ISO string."""
    if dt is None:
        return None
    return dt.isoformat()


def parse_datetime(iso_string: str) -> datetime:
    """Parse ISO datetime string to datetime object."""
    return datetime.fromisoformat(iso_string.replace("Z", "+00:00"))


def to_json(data: Any) -> str:
    """Convert data to JSON string."""
    return json.dumps(data, default=str)


def from_json(json_string: str) -> Any:
    """Parse JSON string to Python object."""
    return json.loads(json_string)


def generate_paystack_reference() -> str:
    """Generate a unique Paystack transaction reference."""
    return f"saphire_{uuid.uuid4().hex[:20]}"


def calculate_credits_cost(simulation_type: str, duration_minutes: Optional[int] = None) -> int:
    """
    Calculate credit cost for a simulation.
    
    Args:
        simulation_type: Type of simulation (interview, presentation)
        duration_minutes: Optional duration for presentation
    
    Returns:
        Credit cost
    """
    if simulation_type == "interview":
        return 10
    elif simulation_type == "presentation":
        base_cost = 15
        if duration_minutes and duration_minutes > 15:
            # Add 5 credits for every additional 15 minutes
            extra_time = max(0, duration_minutes - 15)
            extra_cost = (extra_time // 15) * 5
            return base_cost + extra_cost
        return base_cost
    return 10


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to maximum length."""
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    # Remove or replace unsafe characters
    unsafe_chars = "<>:\"/\\|?*"
    for char in unsafe_chars:
        filename = filename.replace(char, "_")
    return filename


def mask_email(email: str) -> str:
    """Mask email for privacy (e.g., j***@example.com)."""
    if "@" not in email:
        return email
    
    local, domain = email.split("@")
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    
    return f"{masked_local}@{domain}"


def format_naira(amount_kobo: int) -> str:
    """Format amount in kobo to Naira string."""
    amount_naira = amount_kobo / 100
    return f"₦{amount_naira:,.2f}"
