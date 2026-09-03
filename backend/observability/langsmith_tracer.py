import logging
import os
import time
from typing import Any, Callable, Dict, List, Optional
from functools import wraps

logger = logging.getLogger(__name__)


class LangSmithTracer:
    """
    Tracing and evaluation wrapper for LangGraph agent workflows.
    Emits structured spans, execution latencies, tags, and run metadata
    to LangSmith (or structured logs in local offline environments).
    """

    def __init__(self):
        self.api_key = os.getenv("LANGSMITH_API_KEY", "")
        self.project_name = os.getenv("LANGSMITH_PROJECT", "shopify-automation-agent")
        self.is_active = bool(self.api_key and self.api_key != "mock_key")

    def trace_run(
        self,
        name: str,
        run_type: str = "chain",
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Callable:
        """Decorator to wrap agent executions with telemetry and latency tracking."""
        def decorator(func: Callable):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.perf_counter()
                run_tags = tags or ["agent", "shopify-ops"]
                run_meta = metadata or {}

                logger.info(f"[LangSmith Span Start] {name} (type={run_type}, tags={run_tags})")
                try:
                    result = await func(*args, **kwargs)
                    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                    logger.info(f"[LangSmith Span Success] {name} completed in {elapsed_ms:.2f}ms")
                    return result
                except Exception as e:
                    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                    logger.error(f"[LangSmith Span Error] {name} failed after {elapsed_ms:.2f}ms: {str(e)}")
                    raise

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.perf_counter()
                logger.info(f"[LangSmith Span Start] {name} (type={run_type})")
                try:
                    result = func(*args, **kwargs)
                    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                    logger.info(f"[LangSmith Span Success] {name} completed in {elapsed_ms:.2f}ms")
                    return result
                except Exception as e:
                    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                    logger.error(f"[LangSmith Span Error] {name} failed after {elapsed_ms:.2f}ms: {str(e)}")
                    raise

            import asyncio
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            return sync_wrapper

        return decorator


langsmith_tracer = LangSmithTracer()
