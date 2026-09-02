import pytest

from backend.models.order import ConfirmationStatus, Order
from backend.services.workflow.confirmation_graph import build_confirmation_graph, decide_next_action
from backend.services.workflow.confirmation_service import prepare_confirmation_attempt


@pytest.mark.parametrize(
    ("status", "expected_action"),
    [
        ("pending_confirmation", "schedule_call"),
        ("calling", "wait_for_call_outcome"),
        ("no_answer", "schedule_retry"),
        ("busy", "schedule_retry"),
        ("callback_scheduled", "wait_for_callback"),
        ("confirmed", "start_shipping"),
        ("rejected", "stop"),
        ("escalated", "stop"),
        ("unreachable", "stop"),
    ],
)
def test_confirmation_status_routes_to_expected_action(status: str, expected_action: str) -> None:
    assert decide_next_action({"order_id": "42", "status": status}) == {"next_action": expected_action}


def test_unknown_status_is_not_allowed_to_schedule_a_call() -> None:
    """Intentional safety test: unexpected states require human/system review."""

    result = decide_next_action({"order_id": "42", "status": "unknown_provider_state"})
    assert result == {"next_action": "needs_review"}
    assert result["next_action"] != "schedule_call"


def test_compiled_graph_returns_the_same_safe_decision() -> None:
    graph = build_confirmation_graph()

    result = graph.invoke({"order_id": "42", "status": "no_answer", "attempt_count": 1})

    assert result["next_action"] == "schedule_retry"


def test_prepare_confirmation_attempt_advances_only_an_eligible_order() -> None:
    order = Order(id="42", status=ConfirmationStatus.PENDING_CONFIRMATION.value, confirmation_attempt_count=0)

    prepared = prepare_confirmation_attempt(order)

    assert prepared is True
    assert order.status == ConfirmationStatus.CALLING.value
    assert order.confirmation_attempt_count == 1
    assert order.confirmation_started_at is not None


def test_prepare_confirmation_attempt_does_not_reopen_a_terminal_order() -> None:
    order = Order(id="42", status=ConfirmationStatus.CONFIRMED.value, confirmation_attempt_count=2)

    prepared = prepare_confirmation_attempt(order)

    assert prepared is False
    assert order.status == ConfirmationStatus.CONFIRMED.value
    assert order.confirmation_attempt_count == 2
