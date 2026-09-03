"""Order-level operations driven by the confirmation decision graph and call outcomes."""

import datetime
import logging
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.models.order import ConfirmationStatus, Order
from backend.schemas.retell import CallOutcomeResponse
from backend.services.workflow.confirmation_graph import build_confirmation_graph
from backend.services.workflow.tasks import ATTEMPT_CONFIRMATION_CALL, enqueue_workflow_task

logger = logging.getLogger(__name__)


def prepare_confirmation_attempt(order: Order) -> bool:
    """Move an eligible order into ``calling`` before Module 1.6 creates a call.

    Returns ``False`` for terminal or unexpected states. This is intentionally
    side-effect free beyond the in-memory order update; its caller owns the
    database transaction and the future Retell/Plivo request.
    """

    graph = build_confirmation_graph()
    decision = graph.invoke(
        {
            "order_id": order.id,
            "status": order.status,
            "attempt_count": order.confirmation_attempt_count,
        }
    )
    if decision["next_action"] != "schedule_call":
        return False

    order.status = ConfirmationStatus.CALLING.value
    order.confirmation_attempt_count += 1
    order.confirmation_started_at = datetime.datetime.utcnow()
    return True


async def process_call_outcome(
    db: AsyncSession,
    *,
    order_id: str,
    disconnection_reason: str,
    duration_ms: int = 0,
    force_test_delay_seconds: Optional[int] = None,
) -> CallOutcomeResponse:
    """
    Processes a call completion event from Retell.
    Evaluates call outcome using the LangGraph decision logic:
    - If customer confirmed during call, the status is already CONFIRMED (idempotent no-op).
    - If no answer or busy:
        - If attempts < MAX_CONFIRMATION_ATTEMPTS: schedule next retry task with backoff.
        - If attempts >= MAX_CONFIRMATION_ATTEMPTS: transition to UNREACHABLE.
    """
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' was not found."
        )

    previous_status = order.status

    # 1. Idempotent check: If already in a terminal state, don't revert it
    terminal_statuses = {
        ConfirmationStatus.CONFIRMED.value,
        ConfirmationStatus.REJECTED.value,
        ConfirmationStatus.ESCALATED.value,
        ConfirmationStatus.UNREACHABLE.value,
    }
    if previous_status in terminal_statuses:
        logger.info(f"Order {order.id} is already in terminal state '{previous_status}'. No retry scheduled.")
        return CallOutcomeResponse(
            order_id=order.id,
            previous_status=previous_status,
            new_status=previous_status,
            retry_scheduled=False,
            attempt_count=order.confirmation_attempt_count,
            message=f"Order is already in terminal state '{previous_status}'."
        )

    # 2. Check for unanswered/busy outcomes
    unanswered_reasons = {
        "no_answer",
        "busy",
        "voicemail_reached",
        "dial_failed",
        "machine_detected",
        "congested",
    }
    is_unanswered = (disconnection_reason in unanswered_reasons) or (duration_ms < 5000 and disconnection_reason != "user_hangup")

    graph = build_confirmation_graph()

    if is_unanswered:
        decision = graph.invoke(
            {
                "order_id": order.id,
                "status": "no_answer",
                "attempt_count": order.confirmation_attempt_count,
            }
        )
        should_retry = decision["next_action"] == "schedule_retry"

        if should_retry and order.confirmation_attempt_count < settings.MAX_CONFIRMATION_ATTEMPTS:
            # Calculate backoff delay
            if force_test_delay_seconds is not None:
                delay = datetime.timedelta(seconds=force_test_delay_seconds)
            else:
                attempt = order.confirmation_attempt_count
                if attempt == 1:
                    hours = settings.RETRY_DELAY_HOURS_ATTEMPT_1
                elif attempt == 2:
                    hours = settings.RETRY_DELAY_HOURS_ATTEMPT_2
                else:
                    hours = settings.RETRY_DELAY_HOURS_ATTEMPT_3
                delay = datetime.timedelta(hours=hours)

            run_at = datetime.datetime.utcnow() + delay
            next_attempt = order.confirmation_attempt_count + 1
            order.status = ConfirmationStatus.PENDING_CONFIRMATION.value

            idempotency_key = f"order:{order.id}:confirmation-attempt:{next_attempt}"
            await enqueue_workflow_task(
                db,
                order_id=order.id,
                task_type=ATTEMPT_CONFIRMATION_CALL,
                idempotency_key=idempotency_key,
                run_at=run_at,
                attempt_number=next_attempt,
                payload={"reason": f"retry_after_{disconnection_reason}"}
            )
            await db.commit()

            logger.info(
                f"Order {order.id} unanswered ({disconnection_reason}). Scheduled attempt #{next_attempt} for {run_at}."
            )
            return CallOutcomeResponse(
                order_id=order.id,
                previous_status=previous_status,
                new_status=order.status,
                retry_scheduled=True,
                attempt_count=order.confirmation_attempt_count,
                message=f"Attempt {order.confirmation_attempt_count} unanswered ({disconnection_reason}). Next retry scheduled for {run_at.isoformat()}."
            )
        else:
            # Retries exhausted
            order.status = ConfirmationStatus.UNREACHABLE.value
            await db.commit()
            logger.warning(
                f"Order {order.id} exhausted all {settings.MAX_CONFIRMATION_ATTEMPTS} attempts. Marked UNREACHABLE."
            )
            return CallOutcomeResponse(
                order_id=order.id,
                previous_status=previous_status,
                new_status=order.status,
                retry_scheduled=False,
                attempt_count=order.confirmation_attempt_count,
                message=f"Max attempts ({settings.MAX_CONFIRMATION_ATTEMPTS}) reached. Order marked UNREACHABLE."
            )

    # 3. Customer hung up or non-standard exit while still in calling state
    if order.status == ConfirmationStatus.CALLING.value:
        # Not confirmed and not busy; escalate for agent review
        order.status = ConfirmationStatus.ESCALATED.value
        await db.commit()
        return CallOutcomeResponse(
            order_id=order.id,
            previous_status=previous_status,
            new_status=order.status,
            retry_scheduled=False,
            attempt_count=order.confirmation_attempt_count,
            message="Call completed without confirmation. Order moved to human escalation queue."
        )

    return CallOutcomeResponse(
        order_id=order.id,
        previous_status=previous_status,
        new_status=order.status,
        retry_scheduled=False,
        attempt_count=order.confirmation_attempt_count,
        message=f"Call completed with status '{order.status}'."
    )
