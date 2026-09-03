from typing import List
from backend.agents.shipping.state import ShippingGraphState
from backend.integrations.couriers.registry import courier_registry
from backend.schemas.shipment import RateQuoteRequest, RateQuoteResponse


async def fetch_quotes_node(state: ShippingGraphState) -> ShippingGraphState:
    """Query all courier adapters to collect candidate rates for the destination city."""
    request = RateQuoteRequest(
        origin_city="Karachi",
        destination_city=state.get("destination_city", ""),
        weight_kg=state.get("weight_kg", 0.5),
        cod_amount=state.get("cod_amount", 0.0),
        order_id=state.get("order_id")
    )
    # Fetch all competing quotes
    all_quotes = await courier_registry.calculate_all_quotes(request)
    return {
        "all_quotes": all_quotes
    }


def filter_eligibility_node(state: ShippingGraphState) -> ShippingGraphState:
    """Filter out candidate couriers that do not service the destination location."""
    all_quotes: List[RateQuoteResponse] = state.get("all_quotes", [])
    eligible = [q for q in all_quotes if q.is_serviceable]
    return {
        "eligible_quotes": eligible
    }


def evaluate_policies_node(state: ShippingGraphState) -> ShippingGraphState:
    """Apply operational and financial business rules to select the winning courier."""
    eligible: List[RateQuoteResponse] = state.get("eligible_quotes", [])
    cod_amount = state.get("cod_amount", 0.0)
    total_price = state.get("total_order_price", cod_amount)

    # 1. If no couriers service this destination, route to human review
    if not eligible:
        return {
            "selected_courier": None,
            "decision_reason": f"No active courier covers destination city '{state.get('destination_city')}'.",
            "status": "EXCEPTION_REQUIRES_HUMAN"
        }

    # 2. Margin protection rule: shipping cost must not exceed 40% of total order value (if order value > 0)
    # If cheapest courier exceeds margin, route to human review
    cheapest = eligible[0]
    if total_price > 0 and (cheapest.total_cost / total_price) > 0.40 and total_price >= 1500:
        return {
            "selected_courier": None,
            "decision_reason": f"Cheapest delivery cost (PKR {cheapest.total_cost}) exceeds 40% margin threshold of order price (PKR {total_price}).",
            "status": "EXCEPTION_REQUIRES_HUMAN"
        }

    # 3. High-Value Safeguard Policy: Orders >= PKR 10,000 prioritize TCS Express for nationwide loss insurance
    if cod_amount >= 10000.0:
        tcs_quote = next((q for q in eligible if q.courier_code == "tcs"), None)
        if tcs_quote:
            return {
                "selected_courier": tcs_quote,
                "decision_reason": f"High-value parcel (PKR {cod_amount:,.0f}): prioritized TCS Express for loss insurance and low return ratio.",
                "status": "READY_TO_BOOK"
            }

    # 4. Standard Policy: Select lowest cost provider that meets SLA
    winner = eligible[0]
    return {
        "selected_courier": winner,
        "decision_reason": f"Selected {winner.courier_name} as most economical carrier (PKR {winner.total_cost:,.0f}, {winner.estimated_days}d SLA).",
        "status": "READY_TO_BOOK"
    }
