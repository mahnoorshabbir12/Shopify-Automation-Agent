import datetime
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.api.deps import get_db
from backend.main import app
from backend.models.order import ConfirmationStatus, Order
from backend.models.shipment import Shipment, ShipmentStatus

client = TestClient(app)


@pytest.fixture
def mock_db():
    session = AsyncMock()
    return session


def test_get_competing_rates_for_order(mock_db):
    """Test fetching multi-courier competing rate quotes for a confirmed order."""
    order = Order(
        id="order-10601",
        customer_id="cust_ship_1",
        total_price=3800.0,
        currency="PKR",
        shipping_address={"city": "Lahore", "address1": "House 18, Block H, Model Town"},
        status=ConfirmationStatus.CONFIRMED.value
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/v1/shipments/rates/order-10601")
        assert response.status_code == 200
        quotes = response.json()
        assert len(quotes) == 3
        # Rates must be sorted lowest to highest cost
        assert quotes[0]["total_cost"] <= quotes[1]["total_cost"] <= quotes[2]["total_cost"]
        courier_codes = [q["courier_code"] for q in quotes]
        assert "tcs" in courier_codes
        assert "postex" in courier_codes
        assert "blueex" in courier_codes
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_auto_dispatch_standard_order(mock_db):
    """Verify that auto-dispatch routes standard order to most economical courier."""
    order = Order(
        id="order-10601",
        customer_id="cust_ship_1",
        total_price=3800.0,
        currency="PKR",
        shipping_address={"city": "Lahore", "address1": "Model Town"},
        status=ConfirmationStatus.CONFIRMED.value
    )

    # First call to execute checks for existing shipment (None)
    # Second call fetches order (order)
    mock_res_existing = MagicMock()
    mock_res_existing.scalar_one_or_none.return_value = None

    mock_res_order = MagicMock()
    mock_res_order.scalar_one_or_none.return_value = order

    mock_db.execute.side_effect = [mock_res_existing, mock_res_order]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post("/api/v1/shipments/dispatch/order-10601")
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["order_id"] == "order-10601"
        assert data["courier_code"] == "blueex"
        assert data["awb_number"].startswith("BX-")
        assert "blue-ex.com/tracking?cn=" in data["tracking_url"]
        assert data["status"] == ShipmentStatus.BOOKED.value
        assert data["shopify_fulfillment_id"] is not None
        assert mock_db.commit.called
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_auto_dispatch_high_value_order_prioritizes_tcs(mock_db):
    """Verify that high-value order (>10k PKR) auto-dispatches via TCS Express."""
    order = Order(
        id="order-10602",
        customer_id="cust_ship_1",
        total_price=14500.0,
        currency="PKR",
        shipping_address={"city": "Islamabad", "address1": "F-7/2"},
        status=ConfirmationStatus.CONFIRMED.value
    )

    mock_res_existing = MagicMock()
    mock_res_existing.scalar_one_or_none.return_value = None

    mock_res_order = MagicMock()
    mock_res_order.scalar_one_or_none.return_value = order

    mock_db.execute.side_effect = [mock_res_existing, mock_res_order]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post("/api/v1/shipments/dispatch/order-10602")
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["order_id"] == "order-10602"
        assert data["courier_code"] == "tcs"
        assert len(data["awb_number"]) == 11
        assert "tcsexpress.com/tracking?awb=" in data["tracking_url"]
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_manual_courier_override(mock_db):
    """Verify that operator can manually specify a preferred courier."""
    order = Order(
        id="order-10603",
        customer_id="cust_ship_1",
        total_price=2200.0,
        currency="PKR",
        shipping_address={"city": "Lahore", "address1": "Gulberg"},
        status=ConfirmationStatus.CONFIRMED.value
    )

    mock_res_existing = MagicMock()
    mock_res_existing.scalar_one_or_none.return_value = None

    mock_res_order = MagicMock()
    mock_res_order.scalar_one_or_none.return_value = order

    mock_db.execute.side_effect = [mock_res_existing, mock_res_order]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/api/v1/shipments/dispatch/order-10603",
            json={"preferred_courier_code": "postex"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["courier_code"] == "postex"
        assert data["awb_number"].startswith("PX-")
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_dispatch_idempotency_prevents_duplicate_booking(mock_db):
    """Verify that dispatching an already booked order returns existing shipment without double-booking."""
    existing_shipment = Shipment(
        id=99,
        order_id="order-10601",
        courier_code="blueex",
        awb_number="BX-998811",
        tracking_url="https://www.blue-ex.com/tracking?cn=BX-998811",
        status=ShipmentStatus.BOOKED.value,
        shipping_cost=210.0,
        cod_amount=3800.0,
        destination_city="Lahore"
    )

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = existing_shipment
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post("/api/v1/shipments/dispatch/order-10601")
        assert response.status_code == 200
        data = response.json()
        assert data["already_booked"] is True
        assert data["awb_number"] == "BX-998811"
        assert data["courier_code"] == "blueex"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_list_shipments_ledger(mock_db):
    """Verify that booked shipments appear in the shipments ledger."""
    s1 = Shipment(
        id=1,
        order_id="order-10601",
        courier_code="blueex",
        awb_number="BX-11",
        tracking_url="https://blue-ex.com/tracking",
        status=ShipmentStatus.BOOKED.value,
        shipping_cost=210.0,
        cod_amount=3800.0,
        destination_city="Lahore",
        booked_at=datetime.datetime.utcnow()
    )
    s2 = Shipment(
        id=2,
        order_id="order-10602",
        courier_code="tcs",
        awb_number="7780001",
        tracking_url="https://tcsexpress.com/tracking",
        status=ShipmentStatus.BOOKED.value,
        shipping_cost=440.0,
        cod_amount=14500.0,
        destination_city="Islamabad",
        booked_at=datetime.datetime.utcnow()
    )

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [s1, s2]
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/v1/shipments")
        assert response.status_code == 200
        ledger = response.json()
        assert len(ledger) == 2
        order_ids = [s["order_id"] for s in ledger]
        assert "order-10601" in order_ids
        assert "order-10602" in order_ids
    finally:
        app.dependency_overrides.pop(get_db, None)
