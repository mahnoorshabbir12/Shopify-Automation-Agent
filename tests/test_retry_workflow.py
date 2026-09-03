from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.api.deps import get_db
from backend.core.config import settings
from backend.models.order import ConfirmationStatus, Order

client = TestClient(app)

RETELL_SECRET_HEADER = {"X-Retell-Secret": settings.RETELL_WEBHOOK_SECRET}

@pytest.fixture
def mock_db():
    session = AsyncMock()
    return session

def test_retell_webhook_rejects_missing_secret():
    payload = {
        "event": "call_ended",
        "call": {
            "call_id": "call-1",
            "disconnection_reason": "no_answer",
            "retell_llm_dynamic_variables": {"order_id": "order-1"}
        }
    }
    response = client.post("/webhooks/retell/call-ended", json=payload)
    assert response.status_code == 401
    assert "Missing Retell webhook secret" in response.json()["detail"]

def test_retell_webhook_rejects_invalid_secret():
    payload = {
        "event": "call_ended",
        "call": {
            "call_id": "call-1",
            "disconnection_reason": "no_answer",
            "retell_llm_dynamic_variables": {"order_id": "order-1"}
        }
    }
    response = client.post(
        "/webhooks/retell/call-ended",
        json=payload,
        headers={"X-Retell-Secret": "wrong-secret"}
    )
    assert response.status_code == 401
    assert "Invalid Retell webhook secret" in response.json()["detail"]

def test_no_answer_schedules_first_retry(mock_db):
    order = Order(
        id="order-retry-1",
        status=ConfirmationStatus.CALLING.value,
        confirmation_attempt_count=1
    )
    mock_result = MagicMock()
    mock_result.rowcount = 1
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        payload = {
            "event": "call_ended",
            "call": {
                "call_id": "call-retry-1",
                "disconnection_reason": "no_answer",
                "duration_ms": 12000,
                "retell_llm_dynamic_variables": {"order_id": "order-retry-1"}
            }
        }
        response = client.post(
            "/webhooks/retell/call-ended",
            json=payload,
            headers=RETELL_SECRET_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["order_id"] == "order-retry-1"
        assert data["retry_scheduled"] is True
        assert data["new_status"] == ConfirmationStatus.PENDING_CONFIRMATION.value
        assert mock_db.commit.called
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_max_attempts_marks_order_unreachable(mock_db):
    order = Order(
        id="order-maxed",
        status=ConfirmationStatus.CALLING.value,
        confirmation_attempt_count=3 # Already reached MAX_CONFIRMATION_ATTEMPTS
    )
    mock_result = MagicMock()
    mock_result.rowcount = 1
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        payload = {
            "event": "call_ended",
            "call": {
                "call_id": "call-maxed",
                "disconnection_reason": "busy",
                "duration_ms": 8000,
                "retell_llm_dynamic_variables": {"order_id": "order-maxed"}
            }
        }
        response = client.post(
            "/webhooks/retell/call-ended",
            json=payload,
            headers=RETELL_SECRET_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["retry_scheduled"] is False
        assert data["new_status"] == ConfirmationStatus.UNREACHABLE.value
        assert order.status == ConfirmationStatus.UNREACHABLE.value
        assert "UNREACHABLE" in data["message"]
        assert mock_db.commit.called
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_call_ended_on_already_confirmed_order_is_idempotent(mock_db):
    order = Order(
        id="order-confirmed-midcall",
        status=ConfirmationStatus.CONFIRMED.value,
        confirmation_attempt_count=1
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        payload = {
            "event": "call_ended",
            "call": {
                "call_id": "call-100",
                "disconnection_reason": "user_hangup",
                "duration_ms": 65000,
                "retell_llm_dynamic_variables": {"order_id": "order-confirmed-midcall"}
            }
        }
        response = client.post(
            "/webhooks/retell/call-ended",
            json=payload,
            headers=RETELL_SECRET_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["new_status"] == ConfirmationStatus.CONFIRMED.value
        assert data["retry_scheduled"] is False
        assert "already in terminal state" in data["message"]
    finally:
        app.dependency_overrides.pop(get_db, None)
