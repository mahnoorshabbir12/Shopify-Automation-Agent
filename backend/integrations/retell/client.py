import httpx
from typing import Any
import logging

from backend.core.config import settings

logger = logging.logging.getLogger(__name__) if hasattr(logging, 'logging') else logging.getLogger(__name__)

class RetellClient:
    """Async HTTP client for Retell API."""
    
    BASE_URL = "https://api.retellai.com/v2"

    def __init__(self):
        self.api_key = settings.RETELL_API_KEY
        self.agent_id = settings.RETELL_AGENT_ID
        self.from_number = settings.PLIVO_PHONE_NUMBER
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def create_phone_call(self, to_number: str, order_id: str, customer_name: str) -> dict[str, Any]:
        """Initiate an outbound call via Retell."""
        url = f"{self.BASE_URL}/create-phone-call"
        
        payload = {
            "from_number": self.from_number,
            "to_number": to_number,
            "agent_id": self.agent_id,
            "retell_llm_dynamic_variables": {
                "order_id": order_id,
                "customer_name": customer_name
            }
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Retell API error: {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Retell connection error: {str(e)}")
                raise
