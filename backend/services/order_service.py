from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
import logging
from backend.models.order import Customer, Order
from backend.schemas.shopify import ShopifyOrder

logger = logging.getLogger(__name__)

async def ingest_shopify_order(db: AsyncSession, shopify_order: ShopifyOrder):
    """
    Idempotent upsert of a Shopify order and its customer.
    If the webhook is delivered multiple times, it safely ignores the duplicate.
    """
    # 1. Safely Upsert the Customer
    customer_id = str(shopify_order.customer.id) if shopify_order.customer else "unknown"
    
    if shopify_order.customer:
        customer_name = f"{shopify_order.customer.first_name or ''} {shopify_order.customer.last_name or ''}".strip() or "Unknown"
        
        stmt_customer = insert(Customer).values(
            id=customer_id,
            name=customer_name,
            phone=shopify_order.customer.phone or "",
            email=shopify_order.customer.email
        )
        
        # On conflict (duplicate ID), do nothing for now. We can change this to do_update if customer details change often.
        stmt_customer = stmt_customer.on_conflict_do_nothing(index_elements=['id'])
        await db.execute(stmt_customer)

    # 2. Safely Upsert the Order
    order_id = str(shopify_order.id)
    
    stmt_order = insert(Order).values(
        id=order_id,
        customer_id=customer_id,
        total_price=float(shopify_order.total_price),
        currency=shopify_order.currency,
        shipping_address=shopify_order.shipping_address or {}
    )
    
    # On conflict (duplicate order ID), do nothing. This makes our webhook perfectly idempotent.
    stmt_order = stmt_order.on_conflict_do_nothing(index_elements=['id'])
    result = await db.execute(stmt_order)
    
    await db.commit()
    
    # Log if it was actually inserted or skipped
    if result.rowcount > 0:
        logger.info(f"Successfully ingested new Shopify order: {order_id}")
    else:
        logger.info(f"Ignored duplicate Shopify order webhook: {order_id}")
        
    return {"status": "success", "order_id": order_id}
