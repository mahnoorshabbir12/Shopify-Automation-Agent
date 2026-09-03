import os
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.config import settings
from backend.rag.qdrant_retriever import QdrantPolicyRetriever, compute_dense_embedding
from backend.services.knowledge_service import KnowledgeService

client = TestClient(app)
AUTH_HEADER = {"X-Tool-Api-Key": settings.TOOL_API_KEY}

DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "rag", "knowledge_docs")

def test_dense_embedding_shape_and_normalization():
    vec = compute_dense_embedding("cash on delivery courier payment")
    assert len(vec) == 128
    # Should be unit normalized (magnitude approx 1.0)
    magnitude = sum(x * x for x in vec) ** 0.5
    assert abs(magnitude - 1.0) < 1e-4

def test_qdrant_indexing_and_semantic_search():
    retriever = QdrantPolicyRetriever(in_memory=True)
    retriever.index_markdown_documents(DOCS_DIR)

    # 1. Test COD query
    cod_hits = retriever.search("can I pay with physical cash to the rider?", limit=2)
    assert len(cod_hits) > 0
    assert any("COD" in h["topic"] or "payment" in h["category"] for h in cod_hits)

    # 2. Test Delivery timelines query
    shipping_hits = retriever.search("how many days will it take for delivery to Karachi or Islamabad?", limit=2)
    assert len(shipping_hits) > 0
    assert any("Delivery" in h["topic"] or "shipping" in h["category"] for h in shipping_hits)

    # 3. Test Returns query
    returns_hits = retriever.search("I want to return or exchange a defective product", limit=2)
    assert len(returns_hits) > 0
    assert any("Return" in h["topic"] or "returns" in h["category"] for h in returns_hits)

def test_search_knowledge_endpoint_uses_qdrant_rag():
    response = client.post(
        "/tools/search-knowledge",
        json={"query": "is there any courier delivery fee for orders above 3000 rupees?"},
        headers=AUTH_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    # Snippet should contain free shipping threshold or delivery fee
    assert any("200" in r["content"] or "3,000" in r["content"] or "Free Shipping" in r["content"] or "shipping" in r["category"] for r in data["results"])
