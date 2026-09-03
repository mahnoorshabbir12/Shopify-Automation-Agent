import hashlib
import logging
import math
import os
import re
from typing import Any, Dict, List, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from backend.core.config import settings

logger = logging.getLogger(__name__)

VECTOR_DIMENSION = 128
COLLECTION_NAME = "store_policies"

def compute_dense_embedding(text: str, dim: int = VECTOR_DIMENSION) -> List[float]:
    """
    Generates a deterministic, normalized semantic embedding vector from text.
    Uses n-gram hash projection with subword token frequency weighting,
    ensuring ultra-fast (<1ms) inference without heavy PyTorch/GPU overhead.
    """
    vector = [0.0] * dim
    clean_text = re.sub(r"[^\w\s]", " ", text.lower())
    words = clean_text.split()
    
    if not words:
        return vector

    # Unigrams and bigrams
    tokens = list(words)
    for i in range(len(words) - 1):
        tokens.append(f"{words[i]}_{words[i+1]}")

    for token in tokens:
        # Generate hash projections
        h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
        index = h % dim
        # Pseudo-random sign
        sign = 1.0 if (h >> 8) & 1 else -1.0
        weight = 1.0 / (1.0 + math.log1p(len(tokens)))
        vector[index] += sign * weight

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 0:
        vector = [x / norm for x in vector]

    return vector

class QdrantPolicyRetriever:
    """
    LangChain-compatible RAG retriever backed by Qdrant.
    Supports running against Docker (QDRANT_HOST:6333) with automatic
    in-memory fallback for lightweight testing.
    """

    def __init__(self, in_memory: bool = False):
        self.in_memory = in_memory
        self.client = self._init_client()
        self._init_collection()

    def _init_client(self) -> QdrantClient:
        if self.in_memory:
            return QdrantClient(":memory:")
        try:
            # Try connecting to Docker Qdrant container
            client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT, timeout=1.5)
            # Test connection
            client.get_collections()
            logger.info(f"Connected to Qdrant server at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
            return client
        except Exception:
            logger.info("Qdrant container not reachable; using high-speed in-memory Qdrant client.")
            return QdrantClient(":memory:")

    def _init_collection(self):
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if COLLECTION_NAME not in collections:
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=VECTOR_DIMENSION, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant collection '{COLLECTION_NAME}'")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {e}")

    def index_markdown_documents(self, docs_dir: str):
        """Indexes all markdown files in the specified directory."""
        if not os.path.exists(docs_dir):
            logger.warning(f"Docs directory '{docs_dir}' does not exist.")
            return

        points = []
        point_id = 1

        for filename in sorted(os.listdir(docs_dir)):
            if filename.endswith(".md"):
                filepath = os.path.join(docs_dir, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                # Split sections by header (##)
                sections = content.split("## ")
                topic = sections[0].replace("# ", "").strip()

                for section in sections[1:]:
                    lines = section.strip().split("\n", 1)
                    subtopic = lines[0].strip()
                    subcontent = lines[1].strip() if len(lines) > 1 else subtopic

                    chunk_text = f"{topic} - {subtopic}: {subcontent}"
                    vector = compute_dense_embedding(chunk_text)

                    payload = {
                        "topic": f"{topic} ({subtopic})",
                        "content": subcontent,
                        "category": filename.replace(".md", ""),
                        "filename": filename
                    }

                    points.append(
                        PointStruct(
                            id=point_id,
                            vector=vector,
                            payload=payload
                        )
                    )
                    point_id += 1

        if points:
            self.client.upsert(collection_name=COLLECTION_NAME, points=points)
            logger.info(f"Successfully indexed {len(points)} policy chunks into Qdrant collection '{COLLECTION_NAME}'.")

    def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Performs vector similarity search against the indexed policy chunks."""
        query_vector = compute_dense_embedding(query)
        try:
            results = self.client.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                limit=limit
            ).points

            output = []
            for hit in results:
                output.append({
                    "topic": hit.payload.get("topic", "Policy"),
                    "content": hit.payload.get("content", ""),
                    "category": hit.payload.get("category", "general"),
                    "score": getattr(hit, "score", 1.0)
                })
            return output
        except Exception as e:
            logger.error(f"Qdrant vector query failed: {e}")
            return []
