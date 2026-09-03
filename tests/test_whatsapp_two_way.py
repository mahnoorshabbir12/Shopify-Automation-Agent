import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.order import ConfirmationStatus, Order
from backend.integrations.messaging.whatsapp import WhatsAppAdapter
from backend.services.notification_service import NotificationService

client = TestClient(app)


@pytest.mark.asyncio
async def test_whatsapp_send_interactive_buttons():
    """Verify interactive button dispatch formats phone and conforms to button schema."""
    adapter = WhatsAppAdapter()
    res = await adapter.send_interactive_buttons(
        recipient_phone="03001234567",
        header_text="COD Order Confirmation",
        body_text="Please confirm order #10482 for PKR 4,200",
        buttons=[
            {"id": "CONFIRM_ORDER", "title": "Confirm"},
            {"id": "CANCEL_ORDER", "title": "Cancel"}
        ]
    )

    assert res["success"] is True
    assert res["recipient_phone"] == "+923001234567"
    assert res["message_type"] == "interactive"
    assert len(res["buttons"]) == 2
    assert res["external_message_id"].startswith("wamid.")


def test_whatsapp_parse_inbound_webhook_meta_nested():
    """Verify parsing of standard nested Meta WhatsApp Cloud API webhooks."""
    adapter = WhatsAppAdapter()

    # Case A: Button click reply
    meta_button_payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "923005554433",
                        "id": "wamid.HBgLMzkyM...",
                        "type": "interactive",
                        "interactive": {
                            "type": "button_reply",
                            "button_reply": {
                                "id": "CONFIRM_ORDER",
                                "title": "✓ Confirm"
                            }
                        }
                    }]
                }
            }]
        }]
    }
    parsed_btn = adapter.parse_inbound_webhook(meta_button_payload)
    assert parsed_btn["sender_phone"] == "+923005554433"
    assert parsed_btn["button_id"] == "CONFIRM_ORDER"

    # Case B: Natural language text reply
    meta_text_payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "03129876543",
                        "id": "wamid.HBgLMzkyM...",
                        "type": "text",
                        "text": {"body": "haan confirm hai"}
                    }]
                }
            }]
        }]
    }
    parsed_txt = adapter.parse_inbound_webhook(meta_text_payload)
    assert parsed_txt["sender_phone"] == "+923129876543"
    assert parsed_txt["message_text"] == "haan confirm hai"


@pytest.mark.asyncio
async def test_handle_inbound_reply_confirm_action():
    """Verify that CONFIRM_ORDER button transitions order to CONFIRMED with 3-point flags."""
    service = NotificationService()
    mock_order = MagicMock(spec=Order)
    mock_order.id = "10482"
    mock_order.status = ConfirmationStatus.PENDING_CONFIRMATION.value
    mock_order.is_address_confirmed = False
    mock_order.is_amount_confirmed = False
    mock_order.intent_to_receive = False

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = mock_order
    mock_db.execute.return_value = mock_res

    with patch.object(service.whatsapp, "send_message", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {"success": True}
        result = await service.handle_inbound_reply(
            db=mock_db,
            sender_phone="+923005554433",
            message_text="",
            button_id="CONFIRM_ORDER",
            order_id="10482"
        )

    assert result["success"] is True
    assert result["action"] == "confirmed"
    assert mock_order.status == ConfirmationStatus.CONFIRMED.value
    assert mock_order.is_address_confirmed is True
    assert mock_order.is_amount_confirmed is True
    assert mock_order.intent_to_receive is True
    mock_db.commit.assert_awaited()


@pytest.mark.asyncio
async def test_handle_inbound_reply_reschedule_action():
    """Verify that RESCHEDULE_ORDER button updates tags and acknowledges delivery delay."""
    service = NotificationService()
    mock_order = MagicMock(spec=Order)
    mock_order.id = "10483"
    mock_order.tags = "priority"

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = mock_order
    mock_db.execute.return_value = mock_res

    with patch.object(service.whatsapp, "send_message", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {"success": True}
        result = await service.handle_inbound_reply(
            db=mock_db,
            sender_phone="+923005554433",
            message_text="",
            button_id="RESCHEDULE_ORDER",
            order_id="10483"
        )

    assert result["success"] is True
    assert result["action"] == "rescheduled"
    assert "whatsapp_rescheduled" in mock_order.tags


@pytest.mark.asyncio
async def test_handle_inbound_reply_cancel_action():
    """Verify that CANCEL_ORDER button transitions order to REJECTED."""
    service = NotificationService()
    mock_order = MagicMock(spec=Order)
    mock_order.id = "10484"
    mock_order.status = ConfirmationStatus.PENDING_CONFIRMATION.value

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = mock_order
    mock_db.execute.return_value = mock_res

    with patch.object(service.whatsapp, "send_message", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = {"success": True}
        result = await service.handle_inbound_reply(
            db=mock_db,
            sender_phone="+923005554433",
            message_text="",
            button_id="CANCEL_ORDER",
            order_id="10484"
        )

    assert result["success"] is True
    assert result["action"] == "rejected"
    assert mock_order.status == ConfirmationStatus.REJECTED.value


def test_meta_webhook_challenge_handshake():
    """Verify Meta Cloud API GET challenge endpoint responds with challenge token."""
    # Successful challenge
    res = client.get("/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=shopify_ops_verify_token&hub.challenge=115599")
    assert res.status_code == 200
    assert res.text == "115599"

    # Token mismatch -> 403 Forbidden
    res_fail = client.get("/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=115599")
    assert res_fail.status_code == 403


@pytest.mark.asyncio
async def test_simulate_reply_api():
    """Verify the /api/v1/notifications/simulate-reply endpoint parses customer messages."""
    mock_order = MagicMock(spec=Order)
    mock_order.id = "10482"
    mock_order.status = ConfirmationStatus.PENDING_CONFIRMATION.value
    mock_order.is_address_confirmed = False
    mock_order.is_amount_confirmed = False
    mock_order.intent_to_receive = False

    with patch("backend.services.notification_service.notification_service.handle_inbound_reply", new_callable=AsyncMock) as mock_handle:
        mock_handle.return_value = {
            "success": True,
            "action": "confirmed",
            "order_id": "10482",
            "message": "Order #10482 confirmed via WhatsApp reply."
        }

        res = client.post(
            "/api/v1/notifications/simulate-reply",
            json={
                "sender_phone": "+923001234567",
                "message_text": "1",
                "button_id": "CONFIRM_ORDER",
                "order_id": "10482"
            }
        )

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["action"] == "confirmed"
