import asyncio
import logging
import uuid
import sys

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.database.session import get_db
from backend.models.order import Order, WorkflowTask
from backend.services.workflow.tasks import (
    claim_due_workflow_tasks,
    mark_task_completed,
    mark_task_failed,
    ATTEMPT_CONFIRMATION_CALL
)
from backend.services.workflow.confirmation_service import prepare_confirmation_attempt
from backend.integrations.retell.client import RetellClient

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("worker")

async def process_task(db: AsyncSession, task: WorkflowTask, retell_client: RetellClient):
    """Process a single workflow task."""
    logger.info(f"Processing task {task.id} (type: {task.task_type}) for order {task.order_id}")
    
    if task.task_type == ATTEMPT_CONFIRMATION_CALL:
        # Load the order and customer
        stmt = select(Order).where(Order.id == task.order_id).options(selectinload(Order.customer))
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()
        
        if not order:
            logger.error(f"Order {task.order_id} not found for task {task.id}")
            await mark_task_failed(db, task, "Order not found")
            return

        # Let LangGraph decide if we should actually call
        is_eligible = prepare_confirmation_attempt(order)
        if not is_eligible:
            logger.info(f"Order {order.id} is not eligible for a call (status: {order.status})")
            await mark_task_failed(db, task, f"Not eligible for call. Status: {order.status}")
            return
            
        # Place the real call
        try:
            logger.info(f"Initiating Retell call for order {order.id} to {order.customer.phone}")
            call_response = await retell_client.create_phone_call(
                to_number=order.customer.phone,
                order_id=order.id,
                customer_name=order.customer.name
            )
            logger.info(f"Call initiated successfully: {call_response}")
            await mark_task_completed(db, task)
        except Exception as e:
            logger.error(f"Failed to initiate call: {str(e)}")
            await mark_task_failed(db, task, str(e))
    else:
        logger.warning(f"Unknown task type: {task.task_type}")
        await mark_task_failed(db, task, "Unknown task type")

async def worker_loop():
    """Main background worker loop."""
    worker_id = f"worker-{uuid.uuid4().hex[:8]}"
    logger.info(f"Starting worker {worker_id}")
    
    retell_client = RetellClient()
    
    # We use our async DB session generator manually
    async for db in get_db():
        while True:
            try:
                tasks = await claim_due_workflow_tasks(db, worker_id=worker_id, limit=5)
                
                if tasks:
                    logger.info(f"Claimed {len(tasks)} tasks")
                    for task in tasks:
                        await process_task(db, task, retell_client)
                else:
                    # Sleep when there are no tasks
                    await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"Error in worker loop: {str(e)}")
                await asyncio.sleep(5) # Backoff on error

if __name__ == "__main__":
    try:
        asyncio.run(worker_loop())
    except KeyboardInterrupt:
        logger.info("Worker stopped")
