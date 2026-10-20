"""Long-term memory: durable facts about the user, recalled by meaning across conversations.

Facts are extracted from each exchange by the LLM (or saved explicitly by the agent's tool), embedded,
de-duplicated by similarity, and retrieved for each new question. Users can list and delete them.
"""
from __future__ import annotations  # methods named `list` would otherwise shadow the builtin in annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

import numpy as np

from ..db import get_db
from ..llm import LLMClient
from ..rag.embeddings import embed_passages, embed_query

CATEGORIES = ("goal", "risk_profile", "preference", "experience", "plan", "fact")
MAX_MEMORIES_PER_USER = 60
DUPLICATE_SIMILARITY = 0.85
RECALL_MIN_SIMILARITY = 0.3
# Facts that shape every answer are always included, regardless of the question.
ALWAYS_RECALL = ("goal", "risk_profile", "preference")

EXTRACTION_PROMPT = """You maintain long-term memory for an investing assistant. Read ONLY the user's message below and extract durable facts the user states about THEMSELVES.

Extract only explicit self-statements, such as:
- goals and horizons ("I'm saving for a house in 5 years")
- risk appetite or experience ("I'm a beginner", "I can't handle big losses")
- preferences ("reply in Hindi", "I avoid tobacco stocks", "I like IT companies")
- concrete plans they commit to ("I'll invest ₹5,000 every month")

Never extract:
- questions, hypotheticals or examples ("if I sell after 14 months…" is a question, not a plan)
- anything the assistant said or recommended
- market data, prices, holdings or trades (those are read live)
- sensitive data (account numbers, passwords, Aadhaar/PAN, health, exact income)
- facts already in the "Already known" list, even if worded differently

Return JSON: {"memories": [{"text": "<short third-person sentence>", "category": "<goal|risk_profile|preference|experience|plan|fact>"}]}
Usually there is nothing new: then return {"memories": []}."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


class MemoryStore:
    def __init__(self, db=None):
        self.db = db if db is not None else get_db()

    async def list(self, user_id: str) -> list[dict[str, Any]]:
        cursor = self.db.memories.find({"user_id": user_id}, {"embedding": 0}).sort("created_at", -1)
        return [doc async for doc in cursor]

    async def delete(self, user_id: str, memory_id: str) -> bool:
        res = await self.db.memories.delete_one({"_id": memory_id, "user_id": user_id})
        return res.deleted_count == 1

    async def clear(self, user_id: str) -> int:
        res = await self.db.memories.delete_many({"user_id": user_id})
        return res.deleted_count

    async def add(self, user_id: str, text: str, category: str, source: str, conversation_id: str | None = None) -> dict[str, Any] | None:
        """Store a fact unless a near-duplicate exists (then refresh that one instead)."""
        text = text.strip()
        if not text or len(text) > 300:
            return None
        category = category if category in CATEGORIES else "fact"
        vector = (await embed_passages([text]))[0]
        existing = [doc async for doc in self.db.memories.find({"user_id": user_id})]
        for doc in existing:
            if float(np.dot(vector, np.array(doc["embedding"], dtype=np.float32))) >= DUPLICATE_SIMILARITY:
                await self.db.memories.update_one(
                    {"_id": doc["_id"]}, {"$set": {"text": text, "category": category, "updated_at": _now()}}
                )
                return {**doc, "text": text, "category": category}
        if len(existing) >= MAX_MEMORIES_PER_USER:
            oldest = min(existing, key=lambda d: d.get("updated_at") or d["created_at"])
            await self.db.memories.delete_one({"_id": oldest["_id"]})
        doc = {
            "_id": uuid.uuid4().hex,
            "user_id": user_id,
            "text": text,
            "category": category,
            "source": source,
            "conversation_id": conversation_id,
            "embedding": vector.tolist(),
            "created_at": _now(),
            "updated_at": _now(),
        }
        await self.db.memories.insert_one(doc)
        return doc

    async def recall(self, user_id: str, query: str, k: int = 6) -> list[dict[str, Any]]:
        """Always-relevant facts plus the ones most similar to the current question."""
        docs = [doc async for doc in self.db.memories.find({"user_id": user_id})]
        if not docs:
            return []
        q = await embed_query(query)
        scored = sorted(
            ((float(np.dot(q, np.array(d["embedding"], dtype=np.float32))), d) for d in docs),
            key=lambda x: -x[0],
        )
        chosen: dict[str, dict[str, Any]] = {}
        for d in sorted(docs, key=lambda d: d.get("updated_at") or d["created_at"], reverse=True):
            if d["category"] in ALWAYS_RECALL and len(chosen) < 4:
                chosen[d["_id"]] = d
        for score, d in scored:
            if len(chosen) >= k or score < RECALL_MIN_SIMILARITY:
                break
            chosen.setdefault(d["_id"], d)
        return list(chosen.values())

    async def extract_and_store(self, user_id: str, conversation_id: str, user_message: str, assistant_message: str, llm: LLMClient) -> list[str]:
        """Background job after each exchange: extract new self-stated facts from the user's message only.

        The assistant's reply is deliberately not shown to the extractor, so advice is never mistaken for
        something the user said.
        """
        known = [d["text"] async for d in self.db.memories.find({"user_id": user_id}, {"text": 1})]
        known_block = "\n".join(f"- {t}" for t in known[:40]) or "(nothing yet)"
        prompt = [
            {"role": "system", "content": EXTRACTION_PROMPT},
            {"role": "user", "content": f"Already known:\n{known_block}\n\nUser's message:\n{user_message[:1500]}"},
        ]
        raw = await llm.complete(prompt, json_mode=True, max_tokens=400)
        try:
            items = json.loads(raw).get("memories", [])
        except (json.JSONDecodeError, AttributeError):
            return []
        saved = []
        for item in items[:5]:
            if isinstance(item, dict) and item.get("text"):
                doc = await self.add(user_id, item["text"], item.get("category", "fact"), "extracted", conversation_id)
                if doc:
                    saved.append(doc["text"])
        return saved
