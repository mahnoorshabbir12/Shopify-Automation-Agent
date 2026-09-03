import datetime
import logging
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.order import ConfirmationStatus, Order
from backend.schemas.tools import (
    ConfirmOrderRequest,
    ConfirmOrderResponse,
    GetOrderResponse,
    ScheduleCallbackRequest,
    ScheduleCallbackResponse,
    TransferToHumanRequest,
    TransferToHumanResponse,
)
from backend.services.workflow.tasks import ATTEMPT_CONFIRMATION_CALL, enqueue_workflow_task

logger = logging.getLogger(__name__)

class ToolService:
    """
    Business logic and transactional state management for voice agent tools.
    Enforces business rules, 3-point COD confirmation validation, and idempotency.
    """

    @staticmethod
    async def get_order_details(db: AsyncSession, order_id: str) -> GetOrderResponse:
        """Fetches live order data with customer details, sanitized for the voice agent."""
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.customer))
        )
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{order_id}' was not found in the system."
            )

        customer_name = order.customer.name if order.customer else None
        customer_phone = order.customer.phone if order.customer else None

        return GetOrderResponse(
            order_id=order.id,
            status=order.status,
            total_price=order.total_price,
            currency=order.currency or "PKR",
            shipping_address=order.shipping_address or {},
            customer_name=customer_name,
            customer_phone=customer_phone,
            is_address_confirmed=order.is_address_confirmed,
            is_amount_confirmed=order.is_amount_confirmed,
            intent_to_receive=order.intent_to_receive,
            confirmation_attempt_count=order.confirmation_attempt_count,
        )

    @staticmethod
    async def confirm_or_reject_order(db: AsyncSession, payload: ConfirmOrderRequest) -> ConfirmOrderResponse:
        """
        Processes order confirmation according to Phase 1 COD business rules.
        Requires explicit agreement on:
        1. Address (or validated corrected address)
        2. COD Payable Amount
        3. Intent to Receive & Pay upon delivery
        """
        stmt = select(Order).where(Order.id == payload.order_id)
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{payload.order_id}' was not found."
            )

        # Idempotency check: If already confirmed, return success without duplicate side effects
        if order.status == ConfirmationStatus.CONFIRMED.value:
            logger.info(f"Order {order.id} is already CONFIRMED. Returning idempotent response.")
            return ConfirmOrderResponse(
                order_id=order.id,
                status=order.status,
                confirmed=True,
                message="Order is already confirmed."
            )

        # Update address if customer provided corrections
        if payload.corrected_address:
            updated_address = dict(order.shipping_address or {})
            updated_address.update(payload.corrected_address)
            order.shipping_address = updated_address
            logger.info(f"Updated shipping address for order {order.id}: {updated_address}")

        # Strict 3-point check
        has_full_agreement = (
            payload.is_address_confirmed
            and payload.is_amount_confirmed
            and payload.intent_to_receive
        )

        if has_full_agreement:
            order.status = ConfirmationStatus.CONFIRMED.value
            order.is_address_confirmed = True
            order.is_amount_confirmed = True
            order.intent_to_receive = True
            order.confirmed_at = datetime.datetime.utcnow()
            await db.commit()
            logger.info(f"Order {order.id} confirmed with full COD agreement.")
            return ConfirmOrderResponse(
                order_id=order.id,
                status=order.status,
                confirmed=True,
                message="Order confirmed successfully for COD dispatch."
            )

        # Partial or rejected outcomes
        order.is_address_confirmed = payload.is_address_confirmed
        order.is_amount_confirmed = payload.is_amount_confirmed
        order.intent_to_receive = payload.intent_to_receive

        if not payload.intent_to_receive:
            order.status = ConfirmationStatus.REJECTED.value
            message = "Order rejected: customer declined intent to receive parcel."
        elif not payload.is_amount_confirmed:
            order.status = ConfirmationStatus.ESCALATED.value
            message = "Order escalated: customer disputed COD payable amount."
        else:
            order.status = ConfirmationStatus.ESCALATED.value
            message = "Order escalated: delivery address could not be verified."

        await db.commit()
        logger.info(f"Order {order.id} not confirmed. Set to {order.status}: {message}")
        return ConfirmOrderResponse(
            order_id=order.id,
            status=order.status,
            confirmed=False,
            message=message
        )

    @staticmethod
    async def schedule_order_callback(db: AsyncSession, payload: ScheduleCallbackRequest) -> ScheduleCallbackResponse:
        """
        Schedules a callback for when the customer asks to be called later.
        Sets order state to callback_scheduled and enqueues a durable workflow task.
        """
        stmt = select(Order).where(Order.id == payload.order_id)
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{payload.order_id}' was not found."
            )

        if payload.callback_time:
            target_time = payload.callback_time
            # Ensure timezone-naive UTC for DB consistency
            if target_time.tzinfo is not None:
                target_time = target_time.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        else:
            delay = payload.delay_minutes if payload.delay_minutes is not None else 120
            target_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=delay)

        order.status = ConfirmationStatus.CALLBACK_SCHEDULED.value

        # Schedule follow-up task
        timestamp_key = int(target_time.timestamp())
        idempotency_key = f"order:{order.id}:callback:{timestamp_key}"
        attempt_num = (order.confirmation_attempt_count or 0) + 1

        await enqueue_workflow_task(
            db,
            order_id=order.id,
            task_type=ATTEMPT_CONFIRMATION_CALL,
            idempotency_key=idempotency_key,
            run_at=target_time,
            attempt_number=attempt_num,
            payload={"reason": payload.reason or "customer_requested_callback"}
        )

        await db.commit()
        logger.info(f"Scheduled callback for order {order.id} at {target_time.isoformat()}.")

        return ScheduleCallbackResponse(
            order_id=order.id,
            status=order.status,
            scheduled_for=target_time,
            message=f"Callback scheduled for {target_time.strftime('%Y-%m-%d %H:%M UTC')}."
        )

    @staticmethod
    async def escalate_order_to_human(db: AsyncSession, payload: TransferToHumanRequest) -> TransferToHumanResponse:
        """
        Transfers or escalates an order to human review/intervention.
        Marks order state as escalated.
        """
        stmt = select(Order).where(Order.id == payload.order_id)
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{payload.order_id}' was not found."
            )

        order.status = ConfirmationStatus.ESCALATED.value
        await db.commit()
        logger.info(f"Order {order.id} escalated to human queue. Reason: {payload.reason}")

        return TransferToHumanResponse(
            order_id=order.id,
            status=order.status,
            escalated=True,
            message=f"Order escalated to human queue: {payload.reason}"
        )
