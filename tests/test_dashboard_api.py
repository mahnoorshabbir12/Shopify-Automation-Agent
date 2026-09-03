from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.api.deps import get_db
from backend.models.order import ConfirmationStatus, Customer, Order

client = TestClient(app)

@pytest.fixture
def mock_db():
    session = AsyncMock()
    return session

def test_get_dashboard_stats(mock_db):
    orders = [
        Order(id="1", status="confirmed", total_price=3000.0),
        Order(id="2", status="calling", total_price=2500.0),
        Order(id="3", status="escalated", total_price=1500.0)
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = orders
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/v1/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "ai_automation_rate" in data
        assert "total_revenue_pkr" in data
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_get_order_queue(mock_db):
    order = Order(
        id="101",
        status="calling",
        total_price=4000.0,
        currency="PKR",
        shipping_address={"city": "Karachi", "address1": "Gulshan"},
        is_address_confirmed=False,
        is_amount_confirmed=False,
        intent_to_receive=False,
        confirmation_attempt_count=1
    )
    order.customer = Customer(id="c1", name="Ali Khan", phone="+923001234567")

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [order]
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/v1/queue?status=calling")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["id"] == "101"
        assert data[0]["customer_name"] == "Ali Khan"
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_override_order_manual_confirm(mock_db):
    order = Order(
        id="102",
        status="escalated",
        total_price=2000.0
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post("/api/v1/orders/102/override", json={"action": "manual_confirm"})
        assert response.status_code == 200
        data = response.json()
        assert data["order_id"] == "102"
        assert data["status"] == "confirmed"
        assert order.status == ConfirmationStatus.CONFIRMED.value
        assert order.is_address_confirmed is True
        assert order.is_amount_confirmed is True
        assert order.intent_to_receive is True
        assert mock_db.commit.called
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_get_activity_feed():
    response = client.get("/api/v1/activity-feed")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any("confirmed" in item["title"].lower() for item in data)
