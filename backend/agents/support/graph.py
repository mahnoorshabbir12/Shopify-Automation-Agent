from typing import Optional
from langgraph.graph import END, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.support.nodes import classify_intent_node, execute_action_node
from backend.agents.support.state import SupportGraphState


def create_support_graph():
    """Build the compiled StateGraph for conversational customer support."""
    workflow = StateGraph(SupportGraphState)

    workflow.add_node("classify_intent", classify_intent_node)
    # The action execution node is wrapped to optionally forward db context
    workflow.add_node("execute_action", execute_action_node)

    workflow.set_entry_point("classify_intent")
    workflow.add_edge("classify_intent", "execute_action")
    workflow.add_edge("execute_action", END)

    return workflow.compile()


support_graph = create_support_graph()


async def process_support_inquiry(
    query: str,
    order_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Optional[AsyncSession] = None
) -> SupportGraphState:
    """Entrypoint to run the Support LangGraph for incoming voice or chat messages."""
    initial_state: SupportGraphState = {
        "query": query,
        "customer_id": customer_id,
        "order_id": order_id,
        "awb_number": None,
        "intent": "POLICY_FAQ",
        "confidence": 0.0,
        "sentiment_score": 0.0,
        "is_frustrated": False,
        "rag_context": None,
        "tool_result": None,
        "active_ticket_number": None,
        "escalation_needed": False,
        "final_response": "",
        "status": "AWAITING_INPUT"
    }

    # Execute classification
    state_after_classify = classify_intent_node(initial_state)
    
    # Execute action with optional database session
    final_state = await execute_action_node(state_after_classify, db=db)
    
    # Merge outputs
    merged: SupportGraphState = {**state_after_classify, **final_state}
    return merged
