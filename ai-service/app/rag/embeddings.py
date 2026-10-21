"""Local sentence embeddings (BGE-small via ONNX/fastembed): no external API.

Sized for a 512 MB host: one ONNX thread and small batches, since activation memory grows with batch size.
"""
import asyncio
import threading

import numpy as np

from ..config import get_settings

BATCH_SIZE = 8

# BGE models expect this instruction on queries (not on passages) for retrieval.
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "

_model = None
_lock = threading.Lock()


def _get_model():
    global _model
    with _lock:
        if _model is None:
            from fastembed import TextEmbedding
            settings = get_settings()
            _model = TextEmbedding(settings.embedding_model, cache_dir=f"{settings.cache_dir}/models", threads=1)
    return _model


def _normalize(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    return matrix / np.clip(norms, 1e-12, None)


def embed_passages_sync(texts: list[str]) -> np.ndarray:
    if not texts:
        return np.zeros((0, 384), dtype=np.float32)
    return _normalize(np.array(list(_get_model().embed(texts, batch_size=BATCH_SIZE)), dtype=np.float32))


def embed_query_sync(text: str) -> np.ndarray:
    return _normalize(np.array(list(_get_model().embed([QUERY_PREFIX + text])), dtype=np.float32))[0]


async def embed_passages(texts: list[str]) -> np.ndarray:
    return await asyncio.to_thread(embed_passages_sync, texts)


async def embed_query(text: str) -> np.ndarray:
    return await asyncio.to_thread(embed_query_sync, text)
