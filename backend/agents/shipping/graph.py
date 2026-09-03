from langgraph.graph import END, StateGraph
from backend.agents.shipping.nodes import (
    evaluate_policies_node,
    fetch_quotes_node,
    filter_eligibility_node,
)
from backend.agents.shipping.state import ShippingGraphState


def create_shipping_graph():
    """Build the compiled StateGraph for courier selection and optimization."""
    workflow = StateGraph(ShippingGraphState)

    # Add workflow processing nodes
    workflow.add_node("fetch_quotes", fetch_quotes_node)
    workflow.add_node("filter_eligibility", filter_eligibility_node)
    workflow.add_node("evaluate_policies", evaluate_policies_node)

    # Linear execution pipeline
    workflow.set_entry_point("fetch_quotes")
    workflow.add_edge("fetch_quotes", "filter_eligibility")
    workflow.add_edge("filter_eligibility", "evaluate_policies")
    workflow.add_edge("evaluate_policies", END)

    return workflow.compile()


shipping_decision_graph = create_shipping_graph()


async def evaluate_shipping_for_order(
    order_id: str,
    destination_city: str,
    destination_address: str,
    weight_kg: float = 0.5,
    cod_amount: float = 0.0,
    total_order_price: float = 0.0
) -> ShippingGraphState:
    """Execute the Shipping LangGraph for a confirmed Shopify order."""
    initial_state: ShippingGraphState = {
        "order_id": order_id,
        "destination_city": destination_city,
        "destination_address": destination_address,
        "weight_kg": weight_kg,
        "cod_amount": cod_amount,
        "total_order_price": total_order_price or cod_amount,
        "all_quotes": [],
        "eligible_quotes": [],
        "selected_courier": None,
        "decision_reason": "",
        "status": "PENDING",
        "error_message": None
    }

    result = await shipping_decision_graph.ainvoke(initial_state)
    return result
