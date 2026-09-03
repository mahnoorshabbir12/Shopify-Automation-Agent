import datetime
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.api.deps import get_db
from backend.core.config import settings
from backend.main import app
from backend.models.order import Order
from backend.models.shipment import Shipment, ShipmentStatus
from backend.models.support import SupportTicket, TicketStatus

client = TestClient(app)

AUTH_HEADER = {"X-Tool-Api-Key": settings.TOOL_API_KEY}
BEARER_HEADER = {"Authorization": f"Bearer {settings.TOOL_API_KEY}"}


@pytest.fixture
def mock_db():
    session = AsyncMock()
    return session


def test_support_tools_reject_unauthenticated():
    """Verify that support tool endpoints reject requests without valid tool API key."""
    res = client.post("/tools/get-tracking-info", json={"order_id": "order-101"})
    assert res.status_code == 401


def test_get_tracking_info_with_active_shipment(mock_db):
    """Verify WISMO tracking query for an order that has a booked shipment."""
    shipment = Shipment(
        id=1,
        order_id="order-10482",
        courier_code="blueex",
        awb_number="BX-90412",
        status=ShipmentStatus.IN_TRANSIT.value,
        destination_city="Lahore",
        tracking_url="https://blue-ex.com/tracking"
    )
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = shipment
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/get-tracking-info",
            json={"order_id": "order-10482"},
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is True
        assert data["awb_number"] == "BX-90412"
        assert data["courier_name"] == "BlueEX Courier"
        assert "dispatched via BlueEX Courier" in data["human_summary"]
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_get_tracking_info_unfulfilled_order(mock_db):
    """Verify WISMO tracking query for an order that exists but has not yet dispatched."""
    # First query for shipment returns None
    mock_res_ship = MagicMock()
    mock_res_ship.scalar_one_or_none.return_value = None

    # Second query for order returns unfulfilled order
    order = Order(
        id="order-10480",
        status="calling"
    )
    mock_res_order = MagicMock()
    mock_res_order.scalar_one_or_none.return_value = order

    mock_db.execute.side_effect = [mock_res_ship, mock_res_order]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/get-tracking-info",
            json={"order_id": "order-10480"},
            headers=BEARER_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is True
        assert data["status"] == "calling"
        assert "not yet been handed over" in data["human_summary"]
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_create_complaint_generates_ticket(mock_db):
    """Verify registering a customer grievance creates a linked support ticket."""
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/create-complaint",
            json={
                "order_id": "order-10482",
                "issue_type": "DAMAGED_ITEM",
                "description": "Outer box was crushed and perfume bottle leaked.",
                "severity": "urgent"
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["ticket_number"].startswith("TICK-")
        assert "registered under ticket" in data["message"]
        assert mock_db.commit.called
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_request_refund_guardrail_not_delivered(mock_db):
    """Verify refund request is rejected if the parcel has not yet been delivered."""
    order = Order(
        id="order-10482",
        status="confirmed",
        total_price=3800.0,
        created_at=datetime.datetime.utcnow()
    )
    shipment = Shipment(
        id=1,
        order_id="order-10482",
        status="in_transit"
    )

    mock_res_order = MagicMock()
    mock_res_order.scalar_one_or_none.return_value = order

    mock_res_ship = MagicMock()
    mock_res_ship.scalar_one_or_none.return_value = shipment

    mock_db.execute.side_effect = [mock_res_order, mock_res_ship]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/request-refund",
            json={
                "order_id": "order-10482",
                "reason": "Changed my mind"
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_eligible"] is False
        assert data["eligibility_status"] == "INELIGIBLE_NOT_DELIVERED"
        assert "Parcel has not yet been delivered" in data["rejection_reason"]
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_request_refund_guardrail_expired_window(mock_db):
    """Verify refund request is rejected if delivered more than 7 days ago."""
    old_delivery_date = datetime.datetime.utcnow() - datetime.timedelta(days=12)
    order = Order(
        id="order-10470",
        status="delivered",
        total_price=5000.0,
        created_at=old_delivery_date
    )
    shipment = Shipment(
        id=2,
        order_id="order-10470",
        status="delivered"
    )

    mock_res_order = MagicMock()
    mock_res_order.scalar_one_or_none.return_value = order

    mock_res_ship = MagicMock()
    mock_res_ship.scalar_one_or_none.return_value = shipment

    mock_db.execute.side_effect = [mock_res_order, mock_res_ship]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/request-refund",
            json={
                "order_id": "order-10470",
                "reason": "Size does not fit"
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_eligible"] is False
        assert data["eligibility_status"] == "INELIGIBLE_EXPIRED_WINDOW"
        assert "Return window of 7 days has expired" in data["rejection_reason"]
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_request_refund_eligible_creates_ticket(mock_db):
    """Verify refund request is approved and ticket created if within 7 days of delivery."""
    recent_delivery_date = datetime.datetime.utcnow() - datetime.timedelta(days=2)
    order = Order(
        id="order-10481",
        status="delivered",
        total_price=14500.0,
        created_at=recent_delivery_date
    )
    shipment = Shipment(
        id=3,
        order_id="order-10481",
        status="delivered"
    )

    mock_res_order = MagicMock()
    mock_res_order.scalar_one_or_none.return_value = order

    mock_res_ship = MagicMock()
    mock_res_ship.scalar_one_or_none.return_value = shipment

    mock_db.execute.side_effect = [mock_res_order, mock_res_ship]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/tools/request-refund",
            json={
                "order_id": "order-10481",
                "reason": "Color mismatch from product image"
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_eligible"] is True
        assert data["eligibility_status"] == "ELIGIBLE"
        assert data["ticket_number"].startswith("TICK-")
        assert mock_db.commit.called
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_get_inventory_tool():
    """Verify querying inventory returns real stock numbers."""
    response = client.post(
        "/tools/get-inventory",
        json={"product_title_or_sku": "lawn"},
        headers=AUTH_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is True
    assert data["inventory_quantity"] == 14
    assert data["price"] == 4500.0


def test_support_dashboard_ticket_actions(mock_db):
    """Verify listing tickets and operator resolution action."""
    ticket = SupportTicket(
        id=10,
        ticket_number="TICK-77110",
        order_id="order-10482",
        category="complaint",
        priority="urgent",
        status=TicketStatus.OPEN.value,
        summary="Complaint: Damaged Item",
        created_at=datetime.datetime.utcnow()
    )

    # 1. List tickets
    mock_res_list = MagicMock()
    mock_res_list.scalars.return_value.all.return_value = [ticket]
    mock_db.execute.return_value = mock_res_list

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        res = client.get("/api/v1/support/tickets")
        assert res.status_code == 200
        tickets = res.json()
        assert len(tickets) == 1
        assert tickets[0]["ticket_number"] == "TICK-77110"

        # 2. Resolve ticket
        mock_res_single = MagicMock()
        mock_res_single.scalar_one_or_none.return_value = ticket
        mock_db.execute.return_value = mock_res_single

        res_action = client.post(
            "/api/v1/support/tickets/10/action",
            json={"action": "resolve", "notes": "Replacement sent via TCS"}
        )
        assert res_action.status_code == 200
        assert res_action.json()["status"] == TicketStatus.RESOLVED.value
        assert ticket.status == TicketStatus.RESOLVED.value
    finally:
        app.dependency_overrides.pop(get_db, None)
