import re
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.support.state import SupportGraphState
from backend.schemas.support import ComplaintCreateRequest, RefundCreateRequest
from backend.services.knowledge_service import KnowledgeService
from backend.services.support_service import support_service


def extract_order_id_from_text(text: str) -> Optional[str]:
    """Extract an order ID pattern (e.g. #10482 or order-10482 or 10482) from user speech."""
    match = re.search(r"(?:#|order[-_]?)(\d{4,6})", text, re.IGNORECASE)
    if match:
        return f"order-{match.group(1)}"
    # Pure 5-digit number
    num_match = re.search(r"\b(\d{5})\b", text)
    if num_match:
        return f"order-{num_match.group(1)}"
    return None


def classify_intent_node(state: SupportGraphState) -> SupportGraphState:
    """Analyze customer speech to categorize intent and detect frustration."""
    query = state.get("query", "").lower()
    extracted_order = extract_order_id_from_text(query)
    current_order = state.get("order_id") or extracted_order

    # 1. Sentiment & Frustration Analysis
    escalation_keywords = [
        "human", "agent", "representative", "manager", "operator",
        "talk to someone", "real person", "stupid", "worst", "fraud",
        "horrible", "lawyer", "consumer court", "scam"
    ]
    is_frustrated = any(k in query for k in escalation_keywords)

    if is_frustrated:
        return {
            "intent": "ESCALATE",
            "confidence": 0.98,
            "sentiment_score": -0.85,
            "is_frustrated": True,
            "order_id": current_order,
            "escalation_needed": True
        }

    # 2. General Policy & Rules Inquiries (RAG)
    policy_keywords = ["policy", "rules", "terms", "guideline", "how many days", "opening hours", "contact hours"]
    if any(k in query for k in policy_keywords):
        return {
            "intent": "POLICY_FAQ",
            "confidence": 0.96,
            "sentiment_score": 0.1,
            "is_frustrated": False,
            "order_id": current_order
        }

    # 3. Tracking & Status (WISMO)
    tracking_keywords = ["track", "where is", "where's", "status", "delivery", "parcel", "package", "arrive", "reached"]
    if any(k in query for k in tracking_keywords) and ("return" not in query and "refund" not in query):
        return {
            "intent": "WISMO_TRACKING",
            "confidence": 0.95,
            "sentiment_score": 0.0,
            "is_frustrated": False,
            "order_id": current_order
        }

    # 4. Actionable Refunds & Returns
    refund_keywords = ["refund", "return", "money back", "exchange", "cancel order"]
    if any(k in query for k in refund_keywords):
        return {
            "intent": "REFUND",
            "confidence": 0.92,
            "sentiment_score": -0.2,
            "is_frustrated": False,
            "order_id": current_order
        }

    # 4. Complaints & Damages
    complaint_keywords = ["damaged", "broken", "wrong item", "missing", "complaint", "leak", "stolen", "rude rider", "torn"]
    if any(k in query for k in complaint_keywords):
        return {
            "intent": "COMPLAINT",
            "confidence": 0.94,
            "sentiment_score": -0.5,
            "is_frustrated": True,
            "order_id": current_order
        }

    # 5. Product & Inventory
    product_keywords = ["stock", "available", "inventory", "size", "lawn", "kurti", "chiffon", "shoes", "price"]
    if any(k in query for k in product_keywords):
        return {
            "intent": "PRODUCT_INQUIRY",
            "confidence": 0.90,
            "sentiment_score": 0.2,
            "is_frustrated": False,
            "order_id": current_order
        }

    # 6. Default Fallback to Static Store Policy FAQ
    return {
        "intent": "POLICY_FAQ",
        "confidence": 0.85,
        "sentiment_score": 0.1,
        "is_frustrated": False,
        "order_id": current_order
    }


async def execute_action_node(
    state: SupportGraphState,
    db: Optional[AsyncSession] = None
) -> SupportGraphState:
    """Execute the matching tool or RAG retrieval based on classified intent."""
    intent = state.get("intent", "POLICY_FAQ")
    query = state.get("query", "")
    order_id = state.get("order_id")

    if intent == "ESCALATE":
        return {
            "final_response": "I understand your concern and want to make sure you are taken care of. I am transferring you directly to a senior customer support representative right now. Please hold for just a moment.",
            "status": "ESCALATED",
            "escalation_needed": True
        }

    if intent == "WISMO_TRACKING":
        if not db:
            # Fallback mock response for testing without active DB session
            res_summary = (
                f"Your order {order_id or '#10482'} is in transit via BlueEX Courier (AWB BX-90412) "
                f"and is expected to arrive within 24 to 48 hours."
            )
            return {"final_response": res_summary, "status": "RESOLVED"}

        tracking = await support_service.get_tracking_info(db=db, order_id=order_id, awb_number=state.get("awb_number"))
        return {
            "final_response": tracking.human_summary,
            "tool_result": tracking.dict(),
            "status": "RESOLVED"
        }

    if intent == "REFUND":
        target_order = order_id or "order-10481"
        if not db:
            return {
                "final_response": f"Your refund request for order {target_order} has been received. Our team will schedule an inspection pickup within 48 hours.",
                "status": "RESOLVED"
            }
        refund_res = await support_service.request_refund(
            db=db,
            request=RefundCreateRequest(order_id=target_order, reason=query)
        )
        return {
            "final_response": refund_res.message,
            "tool_result": refund_res.dict(),
            "active_ticket_number": refund_res.ticket_number,
            "status": "RESOLVED" if refund_res.is_eligible else "REJECTED"
        }

    if intent == "COMPLAINT":
        target_order = order_id or "order-10482"
        if not db:
            return {
                "final_response": f"We deeply apologize for the inconvenience with order {target_order}. A complaint ticket has been logged with our quality assurance team.",
                "status": "RESOLVED"
            }
        comp_res = await support_service.create_complaint(
            db=db,
            request=ComplaintCreateRequest(order_id=target_order, issue_type="DAMAGED_ITEM", description=query)
        )
        return {
            "final_response": comp_res.message,
            "tool_result": comp_res.dict(),
            "active_ticket_number": comp_res.ticket_number,
            "status": "RESOLVED"
        }

    if intent == "PRODUCT_INQUIRY":
        inv = await support_service.get_inventory(query)
        return {
            "final_response": inv.message,
            "tool_result": inv.dict(),
            "status": "RESOLVED"
        }

    # Intent is POLICY_FAQ -> Query Qdrant Vector RAG
    snippets = await KnowledgeService.search_knowledge(query, limit=2)
    if snippets:
        rag_text = f"According to our store policy: {snippets[0].content}"
    else:
        rag_text = "We offer standard 2 to 4 business days delivery across Pakistan with a 7-day hassle-free return policy on all unworn items with tags intact."

    return {
        "final_response": rag_text,
        "rag_context": snippets[0].content if snippets else "",
        "status": "RESOLVED"
    }
