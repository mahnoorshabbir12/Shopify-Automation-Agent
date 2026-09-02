"""PostgreSQL-backed task scheduling and safe worker claiming."""

import datetime
from collections.abc import Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.order import WorkflowTask, WorkflowTaskStatus


ATTEMPT_CONFIRMATION_CALL = "attempt_confirmation_call"


async def enqueue_workflow_task(
    db: AsyncSession,
    *,
    order_id: str,
    task_type: str,
    idempotency_key: str,
    run_at: datetime.datetime | None = None,
    attempt_number: int = 1,
    payload: dict[str, Any] | None = None,
) -> bool:
    """Schedule one task, ignoring repeat delivery of the same business event.

    The caller controls the surrounding transaction. This lets new-order
    persistence and its first workflow task commit or roll back together.
    """

    statement = insert(WorkflowTask).values(
        order_id=order_id,
        task_type=task_type,
        status=WorkflowTaskStatus.PENDING.value,
        run_at=run_at or datetime.datetime.utcnow(),
        attempt_number=attempt_number,
        payload=payload or {},
        idempotency_key=idempotency_key,
    )
    statement = statement.on_conflict_do_nothing(index_elements=["idempotency_key"])
    result = await db.execute(statement)
    return result.rowcount > 0


async def claim_due_workflow_tasks(
    db: AsyncSession,
    *,
    worker_id: str,
    limit: int = 20,
    now: datetime.datetime | None = None,
) -> Sequence[WorkflowTask]:
    """Claim due tasks without two Postgres workers receiving the same row."""

    due_at = now or datetime.datetime.utcnow()
    statement = (
        select(WorkflowTask)
        .where(
            WorkflowTask.status == WorkflowTaskStatus.PENDING.value,
            WorkflowTask.run_at <= due_at,
        )
        .order_by(WorkflowTask.run_at, WorkflowTask.id)
        .limit(limit)
        .with_for_update(skip_locked=True)
    )
    tasks = list((await db.execute(statement)).scalars())
    for task in tasks:
        task.status = WorkflowTaskStatus.PROCESSING.value
        task.claimed_at = due_at
        task.claimed_by = worker_id
    await db.commit()
    return tasks


async def mark_task_completed(db: AsyncSession, task: WorkflowTask) -> None:
    task.status = WorkflowTaskStatus.COMPLETED.value
    task.completed_at = datetime.datetime.utcnow()
    await db.commit()


async def mark_task_failed(db: AsyncSession, task: WorkflowTask, error_message: str) -> None:
    task.status = WorkflowTaskStatus.FAILED.value
    task.failed_at = datetime.datetime.utcnow()
    task.error_message = error_message
    await db.commit()
