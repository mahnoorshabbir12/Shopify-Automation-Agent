import logging
import os
from typing import List, Optional
from backend.rag.qdrant_retriever import QdrantPolicyRetriever
from backend.schemas.tools import KnowledgeSnippet

logger = logging.getLogger(__name__)

DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "rag", "knowledge_docs")

class KnowledgeService:
    """
    Service for static knowledge retrieval using Qdrant vector search.
    Provides semantic retrieval for store policies, return guidelines,
    and shipping timelines.
    """

    _retriever: Optional[QdrantPolicyRetriever] = None

    @classmethod
    def get_retriever(cls) -> QdrantPolicyRetriever:
        if cls._retriever is None:
            cls._retriever = QdrantPolicyRetriever()
            if os.path.exists(DOCS_DIR):
                cls._retriever.index_markdown_documents(DOCS_DIR)
        return cls._retriever

    @classmethod
    async def search_knowledge(cls, query: str, limit: int = 3) -> List[KnowledgeSnippet]:
        """
        Retrieves the most semantically relevant knowledge base snippets for the query.
        """
        retriever = cls.get_retriever()
        hits = retriever.search(query, limit=limit)

        results = []
        for hit in hits:
            results.append(
                KnowledgeSnippet(
                    topic=hit.get("topic", "Store Policy"),
                    content=hit.get("content", ""),
                    category=hit.get("category", "general")
                )
            )

        # Fallback if no results returned
        if not results:
            results.append(
                KnowledgeSnippet(
                    topic="General Support",
                    content="For questions about your order or policies, our human support team is available Mon-Sat 9AM-6PM PKT.",
                    category="support"
                )
            )

        logger.info(f"RAG search_knowledge for '{query}' returned {len(results)} snippets from Qdrant.")
        return results
