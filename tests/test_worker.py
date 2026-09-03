import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from backend.models.order import Order, WorkflowTask, ConfirmationStatus
from backend.worker import process_task
from backend.services.workflow.tasks import ATTEMPT_CONFIRMATION_CALL

@pytest.fixture
def mock_db_session():
    return AsyncMock()

@pytest.fixture
def mock_retell_client():
    client = AsyncMock()
    client.create_phone_call.return_value = {"call_id": "test-call-id"}
    return client

@pytest.mark.asyncio
async def test_process_task_eligible_order(mock_db_session, mock_retell_client):
    task = WorkflowTask(id=1, task_type=ATTEMPT_CONFIRMATION_CALL, order_id="order-1")
    
    # Mock the database returning an order with a customer
    mock_order = Order(id="order-1", status=ConfirmationStatus.PENDING_CONFIRMATION.value)
    customer = MagicMock()
    customer.phone = "+1234567890"
    customer.name = "Test Customer"
    mock_order.customer = customer
    
    # Setup db.execute(...).scalar_one_or_none() to return mock_order
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_order
    mock_db_session.execute.return_value = mock_result
    
    # We patch prepare_confirmation_attempt to avoid needing to mock LangGraph inside the test
    with patch("backend.worker.prepare_confirmation_attempt", return_value=True) as mock_prepare:
        with patch("backend.worker.mark_task_completed") as mock_complete:
            await process_task(mock_db_session, task, mock_retell_client)
            
            mock_prepare.assert_called_once_with(mock_order)
            mock_retell_client.create_phone_call.assert_called_once_with(
                to_number="+1234567890",
                order_id="order-1",
                customer_name="Test Customer"
            )
            mock_complete.assert_called_once_with(mock_db_session, task)

@pytest.mark.asyncio
async def test_process_task_ineligible_order(mock_db_session, mock_retell_client):
    task = WorkflowTask(id=2, task_type=ATTEMPT_CONFIRMATION_CALL, order_id="order-2")
    
    mock_order = Order(id="order-2", status=ConfirmationStatus.CONFIRMED.value)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_order
    mock_db_session.execute.return_value = mock_result
    
    with patch("backend.worker.prepare_confirmation_attempt", return_value=False):
        with patch("backend.worker.mark_task_failed") as mock_failed:
            await process_task(mock_db_session, task, mock_retell_client)
            
            mock_retell_client.create_phone_call.assert_not_called()
            mock_failed.assert_called_once_with(mock_db_session, task, "Not eligible for call. Status: confirmed")
