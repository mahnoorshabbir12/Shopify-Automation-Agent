from typing import Dict, List, Optional
from typing_extensions import TypedDict
from backend.schemas.shipment import RateQuoteResponse


class ShippingGraphState(TypedDict, total=False):
    """Execution state passed between nodes in the Shipping LangGraph workflow."""
    
    # Input order details
    order_id: str
    destination_city: str
    destination_address: str
    weight_kg: float
    cod_amount: float
    total_order_price: float

    # Evaluated courier options
    all_quotes: List[RateQuoteResponse]
    eligible_quotes: List[RateQuoteResponse]

    # Outcome decision
    selected_courier: Optional[RateQuoteResponse]
    decision_reason: str
    status: str  # 'READY_TO_BOOK', 'EXCEPTION_REQUIRES_HUMAN', 'CANCELLED'
    error_message: Optional[str]
