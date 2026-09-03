import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# --- Order Retrieval ---
class GetOrderRequest(BaseModel):
    order_id: str = Field(..., description="The Shopify order ID or local order ID")

class GetOrderResponse(BaseModel):
    order_id: str
    status: str
    total_price: float
    currency: str
    shipping_address: Dict[str, Any]
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    is_address_confirmed: bool
    is_amount_confirmed: bool
    intent_to_receive: bool
    confirmation_attempt_count: int

# --- COD Confirmation ---
class ConfirmOrderRequest(BaseModel):
    order_id: str = Field(..., description="Shopify Order ID to confirm")
    is_address_confirmed: bool = Field(..., description="Customer confirmed the delivery address is correct")
    is_amount_confirmed: bool = Field(..., description="Customer confirmed and accepted the COD total amount")
    intent_to_receive: bool = Field(..., description="Customer explicitly committed to receive and pay for the parcel upon delivery")
    notes: Optional[str] = Field(None, description="Optional notes from the voice agent conversation")
    corrected_address: Optional[Dict[str, Any]] = Field(None, description="Corrected address fields if the customer updated their address")

class ConfirmOrderResponse(BaseModel):
    order_id: str
    status: str
    confirmed: bool
    message: str

# --- Callback Scheduling ---
class ScheduleCallbackRequest(BaseModel):
    order_id: str = Field(..., description="Shopify Order ID")
    callback_time: Optional[datetime.datetime] = Field(None, description="Explicit target callback datetime (ISO 8601)")
    delay_minutes: Optional[int] = Field(None, description="Delay in minutes from now if explicit datetime not given (e.g. 120)")
    reason: Optional[str] = Field(None, description="Customer request reason (e.g. 'driving', 'busy', 'call back evening')")

class ScheduleCallbackResponse(BaseModel):
    order_id: str
    status: str
    scheduled_for: datetime.datetime
    message: str

# --- Human Escalation ---
class TransferToHumanRequest(BaseModel):
    order_id: str = Field(..., description="Shopify Order ID")
    reason: str = Field(..., description="Reason for escalation (e.g. 'hostile customer', 'disputes price', 'demanded human manager')")
    notes: Optional[str] = Field(None, description="Detailed transcript snippet or agent notes")

class TransferToHumanResponse(BaseModel):
    order_id: str
    status: str
    escalated: bool
    message: str

# --- Knowledge Search (RAG Tool) ---
class SearchKnowledgeRequest(BaseModel):
    query: str = Field(..., description="Customer's policy, shipping, or store query")
    limit: Optional[int] = Field(3, description="Maximum number of knowledge snippets to return")

class KnowledgeSnippet(BaseModel):
    topic: str
    content: str
    category: str

class SearchKnowledgeResponse(BaseModel):
    query: str
    results: List[KnowledgeSnippet]
