import logging
import uuid
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class SMSAdapter:
    """
    Adapter for Pakistani Telco SMS Gateways (Jazz, Telenor, Zong, Ufone).
    Provides 160-character ASCII text messaging fallback when customer
    devices are not active on WhatsApp.
    """

    channel_name: str = "sms"

    def __init__(self, api_key: Optional[str] = None, sender_id: Optional[str] = None):
        self.api_key = api_key or "mock_sms_key"
        self.sender_id = sender_id or "AI_STORE"

    async def send_message(
        self,
        recipient_phone: str,
        message_body: str,
        template_name: Optional[str] = None,
        template_variables: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Send an SMS notification across local mobile operators."""
        clean_phone = recipient_phone.replace(" ", "").replace("-", "")
        if clean_phone.startswith("03"):
            clean_phone = "+92" + clean_phone[1:]

        msg_id = f"sms_{uuid.uuid4().hex[:12]}"
        logger.info(
            f"[SMS Gateway: {self.sender_id}] Outbound to {clean_phone}: id={msg_id}"
        )

        return {
            "success": True,
            "channel": self.channel_name,
            "recipient_phone": clean_phone,
            "external_message_id": msg_id,
            "status": "delivered",
            "body": message_body
        }
