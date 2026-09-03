from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class SupportGraphState(TypedDict, total=False):
    """Conversational state for the Customer Support LangGraph workflow."""

    # Incoming query and context
    query: str
    customer_id: Optional[str]
    order_id: Optional[str]
    awb_number: Optional[str]

    # Intent and classification
    intent: str  # WISMO_TRACKING, POLICY_FAQ, COMPLAINT, REFUND, PRODUCT_INQUIRY, ESCALATE
    confidence: float
    sentiment_score: float  # -1.0 (frustrated) to +1.0 (satisfied)
    is_frustrated: bool

    # Processing outputs
    rag_context: Optional[str]
    tool_result: Optional[Dict[str, Any]]
    active_ticket_number: Optional[str]
    escalation_needed: bool

    # Final voice/chat response
    final_response: str
    status: str  # RESOLVED, ESCALATED, AWAITING_INPUT
