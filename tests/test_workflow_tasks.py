import asyncio
import datetime

from sqlalchemy.dialects import postgresql

from backend.models.order import WorkflowTask, WorkflowTaskStatus
from backend.services.workflow.tasks import claim_due_workflow_tasks, enqueue_workflow_task


class FakeResult:
    def __init__(self, rowcount: int = 0, tasks: list[WorkflowTask] | None = None) -> None:
        self.rowcount = rowcount
        self._tasks = tasks or []

    def scalars(self):
        return self

    def __iter__(self):
        return iter(self._tasks)


class FakeSession:
    def __init__(self, result: FakeResult) -> None:
        self.result = result
        self.statement = None
        self.committed = False

    async def execute(self, statement):
        self.statement = statement
        return self.result

    async def commit(self) -> None:
        self.committed = True


def test_enqueue_reports_whether_the_idempotent_insert_created_a_task() -> None:
    session = FakeSession(FakeResult(rowcount=1))

    created = asyncio.run(
        enqueue_workflow_task(
            session,
            order_id="42",
            task_type="attempt_confirmation_call",
            idempotency_key="order:42:confirmation-attempt:1",
        )
    )

    assert created is True
    params = session.statement.compile(dialect=postgresql.dialect()).params
    assert params["idempotency_key"] == "order:42:confirmation-attempt:1"


def test_duplicate_task_insert_reports_not_created() -> None:
    session = FakeSession(FakeResult(rowcount=0))

    created = asyncio.run(
        enqueue_workflow_task(
            session,
            order_id="42",
            task_type="attempt_confirmation_call",
            idempotency_key="order:42:confirmation-attempt:1",
        )
    )

    assert created is False


def test_claiming_marks_tasks_processing_and_uses_skip_locked() -> None:
    now = datetime.datetime(2026, 9, 2, 9, 0, 0)
    task = WorkflowTask(
        order_id="42",
        task_type="attempt_confirmation_call",
        status=WorkflowTaskStatus.PENDING.value,
        run_at=now,
        attempt_number=1,
        payload={},
        idempotency_key="order:42:confirmation-attempt:1",
    )
    session = FakeSession(FakeResult(tasks=[task]))

    claimed = asyncio.run(claim_due_workflow_tasks(session, worker_id="worker-a", now=now))

    assert claimed == [task]
    assert task.status == WorkflowTaskStatus.PROCESSING.value
    assert task.claimed_by == "worker-a"
    assert task.claimed_at == now
    assert session.committed is True
    compiled = str(session.statement.compile(dialect=postgresql.dialect()))
    assert "FOR UPDATE SKIP LOCKED" in compiled
