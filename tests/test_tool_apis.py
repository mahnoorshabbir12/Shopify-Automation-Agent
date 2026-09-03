import datetime
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.api.deps import get_db
from backend.core.config import settings
from backend.models.order import ConfirmationStatus, Customer, Order, WorkflowTask

client = TestClient(app)

AUTH_HEADER = {"X-Tool-Api-Key": settings.TOOL_API_KEY}
BEARER_HEADER = {"Authorization": f"Bearer {settings.TOOL_API_KEY}"}

@pytest.fixture
def mock_db():
    session = AsyncMock()
    return session

# --- Authentication Tests ---

def test_tool_endpoint_rejects_missing_auth():
    response = client.post("/tools/search-knowledge", json={"query": "returns"})
    assert response.status_code == 401
    assert "Missing tool authentication key" in response.json()["detail"]

def test_tool_endpoint_rejects_invalid_key():
    response = client.post(
        "/tools/search-knowledge",
        json={"query": "returns"},
        headers={"X-Tool-Api-Key": "wrong-key"}
    )
    assert response.status_code == 401
    assert "Invalid tool authentication key" in response.json()["detail"]

def test_tool_endpoint_accepts_bearer_auth():
    response = client.post(
        "/tools/search-knowledge",
        json={"query": "returns"},
        headers=BEARER_HEADER
    )
    assert response.status_code == 200

# --- Knowledge Search Tool Tests ---

def test_search_knowledge_returns_relevant_policy():
    response = client.post(
        "/tools/search-knowledge",
        json={"query": "what is your cash on delivery policy?"},
        headers=AUTH_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "what is your cash on delivery policy?"
    assert len(data["results"]) > 0
    top_result = data["results"][0]
    assert "COD" in top_result["topic"] or "payment" in top_result["category"]
    assert "Pakistan" in top_result["content"]

def test_search_knowledge_return_policy():
    response = client.post(
        "/tools/search-knowledge",
        json={"query": "how many days to exchange or return an item?"},
        headers=AUTH_HEADER
    )
    assert response.status_code == 200
    results = response.json()["results"]
    assert any("7 days" in r["content"] for r in results)

# --- Get Order Tool Tests ---

def test_get_order_success(mock_db):
    customer = Customer(id="cust-1", name="Ahmed Khan", phone="+923001234567")
    order = Order(
        id="order-101",
        status=ConfirmationStatus.PENDING_CONFIRMATION.value,
        total_price=3500.0,
        currency="PKR",
        shipping_address={"city": "Karachi", "address1": "Gulshan block 4"},
        is_address_confirmed=False,
        is_amount_confirmed=False,
        intent_to_receive=False,
        confirmation_attempt_count=1
    )
    order.customer = customer

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/get-order",
            json={"order_id": "order-101"},
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["order_id"] == "order-101"
        assert data["total_price"] == 3500.0
        assert data["customer_name"] == "Ahmed Khan"
        assert data["shipping_address"]["city"] == "Karachi"
        assert data["status"] == "pending_confirmation"
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_get_order_not_found(mock_db):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/get-order",
            json={"order_id": "nonexistent"},
            headers=AUTH_HEADER
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)

# --- Confirm Order Tool Tests (COD 3-point rules) ---

def test_confirm_order_full_agreement(mock_db):
    order = Order(
        id="order-200",
        status=ConfirmationStatus.CALLING.value,
        total_price=2500.0,
        shipping_address={"city": "Lahore", "address1": "DHA Phase 5"},
        is_address_confirmed=False,
        is_amount_confirmed=False,
        intent_to_receive=False
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/confirm-order",
            json={
                "order_id": "order-200",
                "is_address_confirmed": True,
                "is_amount_confirmed": True,
                "intent_to_receive": True,
                "notes": "Customer confirmed all details happily"
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == ConfirmationStatus.CONFIRMED.value
        assert data["confirmed"] is True
        assert order.status == ConfirmationStatus.CONFIRMED.value
        assert order.is_address_confirmed is True
        assert order.is_amount_confirmed is True
        assert order.intent_to_receive is True
        assert order.confirmed_at is not None
        mock_db.commit.assert_called_once()
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_confirm_order_address_correction(mock_db):
    order = Order(
        id="order-201",
        status=ConfirmationStatus.CALLING.value,
        total_price=1200.0,
        shipping_address={"city": "Karachi", "address1": "Old Address"},
        is_address_confirmed=False,
        is_amount_confirmed=False,
        intent_to_receive=False
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/confirm-order",
            json={
                "order_id": "order-201",
                "is_address_confirmed": True,
                "is_amount_confirmed": True,
                "intent_to_receive": True,
                "corrected_address": {"address1": "House 45, Street 10", "city": "Islamabad"}
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        assert order.shipping_address["address1"] == "House 45, Street 10"
        assert order.shipping_address["city"] == "Islamabad"
        assert order.status == ConfirmationStatus.CONFIRMED.value
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_confirm_order_declined_intent_rejects_order(mock_db):
    order = Order(
        id="order-202",
        status=ConfirmationStatus.CALLING.value,
        total_price=2000.0,
        shipping_address={"city": "Multan"},
        is_address_confirmed=True,
        is_amount_confirmed=True,
        intent_to_receive=False
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/confirm-order",
            json={
                "order_id": "order-202",
                "is_address_confirmed": True,
                "is_amount_confirmed": True,
                "intent_to_receive": False, # Customer changed mind / refuses delivery
                "notes": "Customer stated they no longer want the product."
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["confirmed"] is False
        assert data["status"] == ConfirmationStatus.REJECTED.value
        assert order.status == ConfirmationStatus.REJECTED.value
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_confirm_order_idempotent_if_already_confirmed(mock_db):
    order = Order(
        id="order-203",
        status=ConfirmationStatus.CONFIRMED.value,
        total_price=5000.0,
        shipping_address={"city": "Karachi"},
        is_address_confirmed=True,
        is_amount_confirmed=True,
        intent_to_receive=True
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/confirm-order",
            json={
                "order_id": "order-203",
                "is_address_confirmed": True,
                "is_amount_confirmed": True,
                "intent_to_receive": True
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["confirmed"] is True
        assert data["status"] == ConfirmationStatus.CONFIRMED.value
        assert "already confirmed" in data["message"].lower()
    finally:
        app.dependency_overrides.pop(get_db, None)

# --- Schedule Callback Tool Tests ---

def test_schedule_callback_sets_status_and_enqueues_task(mock_db):
    order = Order(
        id="order-300",
        status=ConfirmationStatus.CALLING.value,
        confirmation_attempt_count=1
    )
    mock_result = MagicMock()
    mock_result.rowcount = 1
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/schedule-callback",
            json={
                "order_id": "order-300",
                "delay_minutes": 60,
                "reason": "customer is driving"
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == ConfirmationStatus.CALLBACK_SCHEDULED.value
        assert order.status == ConfirmationStatus.CALLBACK_SCHEDULED.value
        assert mock_db.commit.called
    finally:
        app.dependency_overrides.pop(get_db, None)

# --- Transfer to Human Tool Tests ---

def test_transfer_to_human_escalates_order(mock_db):
    order = Order(
        id="order-400",
        status=ConfirmationStatus.CALLING.value
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/transfer-to-human",
            json={
                "order_id": "order-400",
                "reason": "customer aggressively demanded manager",
                "notes": "Disputing delivery charges"
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == ConfirmationStatus.ESCALATED.value
        assert data["escalated"] is True
        assert order.status == ConfirmationStatus.ESCALATED.value
        assert mock_db.commit.called
    finally:
        app.dependency_overrides.pop(get_db, None)
