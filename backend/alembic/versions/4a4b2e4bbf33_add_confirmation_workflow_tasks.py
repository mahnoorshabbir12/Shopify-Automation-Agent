"""Add durable confirmation workflow tasks.

Revision ID: 4a4b2e4bbf33
Revises: d37d8a005920
Create Date: 2026-09-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4a4b2e4bbf33"
down_revision: Union[str, Sequence[str], None] = "d37d8a005920"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("confirmation_attempt_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("orders", sa.Column("confirmation_started_at", sa.DateTime(), nullable=True))
    op.add_column("orders", sa.Column("confirmed_at", sa.DateTime(), nullable=True))

    op.create_table(
        "workflow_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=False),
        sa.Column("task_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("run_at", sa.DateTime(), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("idempotency_key", sa.String(), nullable=False),
        sa.Column("claimed_at", sa.DateTime(), nullable=True),
        sa.Column("claimed_by", sa.String(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("failed_at", sa.DateTime(), nullable=True),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key", name="uq_workflow_tasks_idempotency_key"),
    )
    op.create_index("ix_workflow_tasks_due", "workflow_tasks", ["status", "run_at"], unique=False)
    op.create_index("ix_workflow_tasks_order_id", "workflow_tasks", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_workflow_tasks_order_id", table_name="workflow_tasks")
    op.drop_index("ix_workflow_tasks_due", table_name="workflow_tasks")
    op.drop_table("workflow_tasks")
    op.drop_column("orders", "confirmed_at")
    op.drop_column("orders", "confirmation_started_at")
    op.drop_column("orders", "confirmation_attempt_count")
