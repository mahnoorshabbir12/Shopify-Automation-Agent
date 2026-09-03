from unittest.mock import AsyncMock
import pytest
from fastapi.testclient import TestClient

from backend.agents.support.graph import process_support_inquiry
from backend.agents.support.nodes import classify_intent_node, extract_order_id_from_text
from backend.agents.support.state import SupportGraphState
from backend.api.deps import get_db
from backend.main import app

client = TestClient(app)


def test_order_id_extraction_regex():
    """Verify extracting various formats of order numbers from user speech."""
    assert extract_order_id_from_text("Where is #10482?") == "order-10482"
    assert extract_order_id_from_text("check order-99120 please") == "order-99120"
    assert extract_order_id_from_text("my package 55432 is late") == "order-55432"
    assert extract_order_id_from_text("no order here") is None


def test_classify_intent_wismo_tracking():
    """Verify tracking queries are correctly routed to WISMO intent."""
    state: SupportGraphState = {
        "query": "Where is my package for order #10482? Has it arrived in Lahore?"
    }
    res = classify_intent_node(state)
    assert res["intent"] == "WISMO_TRACKING"
    assert res["order_id"] == "order-10482"
    assert res["is_frustrated"] is False


def test_classify_intent_frustrated_human_escalation():
    """Verify angry customer speech triggers immediate human escalation."""
    state: SupportGraphState = {
        "query": "This is ridiculous! Connect me to a real human manager right now, your service is terrible."
    }
    res = classify_intent_node(state)
    assert res["intent"] == "ESCALATE"
    assert res["is_frustrated"] is True
    assert res["escalation_needed"] is True
    assert res["sentiment_score"] < -0.5


def test_classify_intent_refund_and_returns():
    """Verify refund queries map to REFUND intent."""
    state: SupportGraphState = {
        "query": "I want a refund for my order #10481 because the size did not fit."
    }
    res = classify_intent_node(state)
    assert res["intent"] == "REFUND"
    assert res["order_id"] == "order-10481"


def test_classify_intent_product_inventory():
    """Verify product queries map to PRODUCT_INQUIRY intent."""
    state: SupportGraphState = {
        "query": "Do you have lawn suits in stock? What is the price?"
    }
    res = classify_intent_node(state)
    assert res["intent"] == "PRODUCT_INQUIRY"


@pytest.mark.asyncio
async def test_end_to_end_support_inquiry_policy_faq():
    """Verify static policy query retrieves from RAG knowledge base."""
    result = await process_support_inquiry(
        query="What is your return policy and how many days do I have?"
    )
    assert result["intent"] == "POLICY_FAQ"
    assert len(result["final_response"]) > 20
    assert result["status"] == "RESOLVED"


@pytest.mark.asyncio
async def test_end_to_end_support_inquiry_escalation():
    """Verify human escalation returns empathetic handover speech."""
    result = await process_support_inquiry(
        query="Stop automated messages! Transfer me to an operator or human immediately."
    )
    assert result["intent"] == "ESCALATE"
    assert result["escalation_needed"] is True
    assert "transferring you directly" in result["final_response"]
    assert result["status"] == "ESCALATED"


def test_simulate_support_chat_endpoint():
    """Verify the /api/v1/support/chat endpoint invokes the LangGraph workflow."""
    from unittest.mock import MagicMock
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/api/v1/support/chat",
            json={"query": "Where is my parcel for order #10482?"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["intent"] == "WISMO_TRACKING"
        assert len(data["final_response"]) > 10
        assert data["order_id"] == "order-10482"
    finally:
        app.dependency_overrides.pop(get_db, None)
