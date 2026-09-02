"""Order-level operations driven by the confirmation decision graph."""

import datetime

from backend.models.order import ConfirmationStatus, Order
from backend.services.workflow.confirmation_graph import build_confirmation_graph


def prepare_confirmation_attempt(order: Order) -> bool:
    """Move an eligible order into ``calling`` before Module 1.6 creates a call.

    Returns ``False`` for terminal or unexpected states. This is intentionally
    side-effect free beyond the in-memory order update; its caller owns the
    database transaction and the future Retell/Plivo request.
    """

    graph = build_confirmation_graph()
    decision = graph.invoke(
        {
            "order_id": order.id,
            "status": order.status,
            "attempt_count": order.confirmation_attempt_count,
        }
    )
    if decision["next_action"] != "schedule_call":
        return False

    order.status = ConfirmationStatus.CALLING.value
    order.confirmation_attempt_count += 1
    order.confirmation_started_at = datetime.datetime.utcnow()
    return True
