import datetime
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.api.deps import get_db
from backend.integrations.messaging.sms import SMSAdapter
from backend.integrations.messaging.whatsapp import WhatsAppAdapter
from backend.main import app
from backend.models.order import ConfirmationStatus, Order
from backend.models.shipment import Shipment
from backend.services.notification_service import NotificationService

client = TestClient(app)


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.mark.asyncio
async def test_whatsapp_adapter_formatting_and_sending():
    """Verify WhatsApp adapter formats local Pakistani mobile numbers and returns message metadata."""
    adapter = WhatsAppAdapter()
    res = await adapter.send_message(
        recipient_phone="0300 1234567",
        message_body="Test message",
        template_name="order_dispatch_alert"
    )
    assert res["success"] is True
    assert res["channel"] == "whatsapp"
    assert res["recipient_phone"] == "+923001234567"
    assert res["external_message_id"].startswith("wamid.")


@pytest.mark.asyncio
async def test_sms_adapter_sending():
    """Verify local SMS gateway adapter generates valid SMS message receipts."""
    adapter = SMSAdapter()
    res = await adapter.send_message(
        recipient_phone="0321 8899001",
        message_body="Your parcel is dispatched."
    )
    assert res["success"] is True
    assert res["channel"] == "sms"
    assert res["recipient_phone"] == "+923218899001"
    assert res["external_message_id"].startswith("sms_")


@pytest.mark.asyncio
async def test_notification_service_send_dispatch_alert(mock_db):
    """Verify dispatch alert logs tracking URL and courier details to database."""
    order = Order(
        id="order-10482",
        status="confirmed",
        total_price=3800.0,
        customer_id="cust-1",
        shipping_address={"city": "Lahore"}
    )
    shipment = Shipment(
        id=1,
        order_id="order-10482",
        courier_code="blueex",
        awb_number="BX-90412",
        tracking_url="https://blue-ex.com/tracking?cn=BX-90412"
    )

    service = NotificationService()
    log = await service.send_dispatch_alert(
        db=mock_db,
        order=order,
        shipment=shipment,
        customer_name="Hamza Abbasi",
        customer_phone="+923005554433"
    )

    assert log.order_id == "order-10482"
    assert "BX-90412" in log.content
    assert "https://blue-ex.com/tracking" in log.content
    assert log.channel == "whatsapp"
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_notification_service_send_unreachable_reminder(mock_db):
    """Verify sending interactive two-way confirmation reminder."""
    order = Order(
        id="order-10480",
        status="unreachable",
        total_price=2450.0,
        customer_id="cust-2",
        shipping_address={"city": "Karachi"}
    )

    service = NotificationService()
    log = await service.send_unreachable_reminder(
        db=mock_db,
        order=order,
        customer_name="Bilal Farooq",
        customer_phone="+923331122334"
    )

    assert log.order_id == "order-10480"
    assert "reply '1' to CONFIRM" in log.content
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_inbound_reply_confirm_order(mock_db):
    """Verify customer replying '1' to WhatsApp automatically confirms order."""
    order = Order(
        id="order-10480",
        status="calling",
        total_price=2450.0,
        created_at=datetime.datetime.utcnow(),
        customer_id="cust-2",
        shipping_address={"city": "Karachi"}
    )
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_res

    service = NotificationService()
    result = await service.handle_inbound_reply(
        db=mock_db,
        sender_phone="+923331122334",
        message_text="1"
    )

    assert result["success"] is True
    assert result["action"] == "confirmed"
    assert order.status == ConfirmationStatus.CONFIRMED.value
    assert order.is_address_confirmed is True
    assert order.intent_to_receive is True
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_inbound_reply_cancel_order(mock_db):
    """Verify customer replying 'cancel' marks order rejected."""
    order = Order(
        id="order-10480",
        status="calling",
        total_price=2450.0,
        created_at=datetime.datetime.utcnow(),
        customer_id="cust-2",
        shipping_address={"city": "Karachi"}
    )
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_res

    service = NotificationService()
    result = await service.handle_inbound_reply(
        db=mock_db,
        sender_phone="+923331122334",
        message_text="cancel"
    )

    assert result["success"] is True
    assert result["action"] == "rejected"
    assert order.status == ConfirmationStatus.REJECTED.value
    assert mock_db.commit.called


def test_webhook_inbound_whatsapp_endpoint(mock_db):
    """Verify the /webhooks/whatsapp endpoint processes customer replies."""
    order = Order(
        id="order-10480",
        status="calling",
        total_price=2450.0,
        created_at=datetime.datetime.utcnow(),
        customer_id="cust-2",
        shipping_address={"city": "Karachi"}
    )
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = order
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/webhooks/whatsapp",
            json={
                "sender_phone": "+923331122334",
                "message_text": "YES"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["action"] == "confirmed"
    finally:
        app.dependency_overrides.pop(get_db, None)
