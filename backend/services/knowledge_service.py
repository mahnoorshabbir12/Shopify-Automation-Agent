import logging
import re
from typing import List
from backend.schemas.tools import KnowledgeSnippet

logger = logging.getLogger(__name__)

STORE_KNOWLEDGE_BASE = [
    {
        "topic": "Cash on Delivery (COD) Policy",
        "category": "payment",
        "content": (
            "We offer Cash on Delivery (COD) across Pakistan. Payment must be made in cash "
            "directly to the courier rider upon delivery. Couriers cannot hand over the parcel "
            "before full payment is received. Open-box delivery is subject to courier rules."
        ),
        "keywords": ["cod", "cash", "payment", "delivery", "pay", "rider", "open box", "advance"]
    },
    {
        "topic": "Delivery Timelines & Shipping Rates",
        "category": "shipping",
        "content": (
            "Standard delivery takes 2 to 4 business days for major cities (Karachi, Lahore, Islamabad/Rawalpindi) "
            "and 3 to 6 business days for other regional areas. Shipping fee is PKR 200 flat, or free on orders above PKR 3,000. "
            "Deliveries are handled by partner couriers TCS, PostEx, and BlueEX."
        ),
        "keywords": ["shipping", "delivery", "time", "days", "charges", "rate", "tcs", "postex", "blueex", "delay"]
    },
    {
        "topic": "Return & Exchange Policy",
        "category": "returns",
        "content": (
            "Customers may initiate a return or exchange within 7 days of receiving the order. "
            "Items must be unused, unwashed, with original tags and packaging intact. "
            "For defective or incorrect items, we cover the return shipping cost."
        ),
        "keywords": ["return", "exchange", "refund", "replace", "damaged", "defective", "7 days", "policy"]
    },
    {
        "topic": "Order Modification & Cancellation",
        "category": "order_management",
        "content": (
            "Orders can be cancelled or delivery addresses updated during the confirmation call "
            "before shipment is booked. Once the courier tracking number (AWB) is issued, "
            "the order cannot be cancelled directly and must follow the return procedure."
        ),
        "keywords": ["cancel", "change", "modify", "address", "update", "awb", "tracking"]
    },
    {
        "topic": "Customer Support Hours",
        "category": "support",
        "content": (
            "Our human support representatives are available Monday through Saturday, 9:00 AM to 6:00 PM PKT. "
            "Inquiries received outside working hours are queued and responded to on the next business day."
        ),
        "keywords": ["human", "agent", "support", "timing", "hours", "contact", "phone", "help", "representative"]
    }
]

class KnowledgeService:
    """
    Service for static knowledge retrieval.
    Acts as the seam for Module 1.9's LangChain RAG vector store, ensuring
    the Retell tool endpoint remains unchanged when embeddings are plugged in.
    """

    @staticmethod
    async def search_knowledge(query: str, limit: int = 3) -> List[KnowledgeSnippet]:
        """
        Retrieves the most relevant knowledge base snippets for the voice agent query.
        """
        query_words = set(re.findall(r"\w+", query.lower()))
        scored_items = []

        for item in STORE_KNOWLEDGE_BASE:
            score = 0
            # Check keywords match
            for kw in item["keywords"]:
                if kw in query.lower() or any(w == kw for w in query_words):
                    score += 2
            # Check topic/content token overlap
            topic_words = set(re.findall(r"\w+", item["topic"].lower()))
            overlap = query_words.intersection(topic_words)
            score += len(overlap) * 3

            content_words = set(re.findall(r"\w+", item["content"].lower()))
            content_overlap = query_words.intersection(content_words)
            score += len(content_overlap)

            if score > 0:
                scored_items.append((score, item))

        # Sort by relevance score descending
        scored_items.sort(key=lambda x: x[0], reverse=True)

        results = []
        for _, item in scored_items[:limit]:
            results.append(
                KnowledgeSnippet(
                    topic=item["topic"],
                    content=item["content"],
                    category=item["category"]
                )
            )

        # Fallback if no specific keywords matched
        if not results:
            for item in STORE_KNOWLEDGE_BASE[:limit]:
                results.append(
                    KnowledgeSnippet(
                        topic=item["topic"],
                        content=item["content"],
                        category=item["category"]
                    )
                )

        logger.info(f"search_knowledge for '{query}' returned {len(results)} snippets.")
        return results
