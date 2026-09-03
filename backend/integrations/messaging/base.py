from typing import Any, Dict, Optional, Protocol, runtime_checkable


@runtime_checkable
class MessagingAdapter(Protocol):
    """Unified protocol for outbound transactional messaging gateways."""

    channel_name: str

    async def send_message(
        self,
        recipient_phone: str,
        message_body: str,
        template_name: Optional[str] = None,
        template_variables: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Send a transactional notification and return delivery metadata."""
        ...
