"""Pure LangGraph routing for the COD confirmation lifecycle.

This graph decides the next operational action. Database writes and external
calls live outside it so the routing is deterministic and straightforward to
test.
"""

from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from backend.models.order import ConfirmationStatus


WorkflowAction = Literal[
    "schedule_call",
    "wait_for_call_outcome",
    "schedule_retry",
    "wait_for_callback",
    "start_shipping",
    "stop",
    "needs_review",
]


class ConfirmationWorkflowState(TypedDict, total=False):
    order_id: str
    status: str
    attempt_count: int
    next_action: WorkflowAction


def decide_next_action(state: ConfirmationWorkflowState) -> ConfirmationWorkflowState:
    """Map a persisted order status to one safe, explicit next action."""

    status = state["status"]
    action_by_status: dict[str, WorkflowAction] = {
        ConfirmationStatus.PENDING_CONFIRMATION.value: "schedule_call",
        ConfirmationStatus.CALLING.value: "wait_for_call_outcome",
        ConfirmationStatus.CALLBACK_SCHEDULED.value: "wait_for_callback",
        ConfirmationStatus.CONFIRMED.value: "start_shipping",
        ConfirmationStatus.REJECTED.value: "stop",
        ConfirmationStatus.ESCALATED.value: "stop",
        ConfirmationStatus.UNREACHABLE.value: "stop",
        "no_answer": "schedule_retry",
        "busy": "schedule_retry",
    }
    return {"next_action": action_by_status.get(status, "needs_review")}


def build_confirmation_graph():
    """Build the reusable, deterministic confirmation decision graph."""

    graph = StateGraph(ConfirmationWorkflowState)
    graph.add_node("decide_next_action", decide_next_action)
    graph.add_edge(START, "decide_next_action")
    # Execution belongs to the task worker. This graph only makes the next
    # action explicit, then returns that decision to its caller.
    graph.add_edge("decide_next_action", END)
    return graph.compile()
