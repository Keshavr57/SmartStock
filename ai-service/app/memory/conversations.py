"""Conversation storage (short-term memory).

The model sees a rolling summary of older turns plus the most recent messages verbatim, so long chats
stay within the context budget without forgetting what was discussed earlier.
"""
from __future__ import annotations  # methods named `list` would otherwise shadow the builtin in annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from ..config import get_settings
from ..db import get_db
from ..llm import LLMClient


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ConversationStore:
    def __init__(self, db=None):
        self.db = db if db is not None else get_db()
        self.settings = get_settings()

    async def create(self, user_id: str, title: str) -> dict[str, Any]:
        doc = {
            "_id": uuid.uuid4().hex,
            "user_id": user_id,
            "title": title,
            "summary": "",
            "summarized_upto": 0,
            "messages": [],
            "created_at": _now(),
            "updated_at": _now(),
        }
        await self.db.conversations.insert_one(doc)
        return doc

    async def get(self, user_id: str, conversation_id: str) -> dict[str, Any] | None:
        return await self.db.conversations.find_one({"_id": conversation_id, "user_id": user_id})

    async def list(self, user_id: str, limit: int = 30) -> list[dict[str, Any]]:
        cursor = self.db.conversations.find(
            {"user_id": user_id}, {"title": 1, "updated_at": 1, "created_at": 1, "messages": {"$slice": -1}}
        ).sort("updated_at", -1).limit(limit)
        return [doc async for doc in cursor]

    async def delete(self, user_id: str, conversation_id: str) -> bool:
        res = await self.db.conversations.delete_one({"_id": conversation_id, "user_id": user_id})
        return res.deleted_count == 1

    async def append(self, user_id: str, conversation_id: str, *messages: dict[str, Any]) -> None:
        stamped = [{"id": m.get("id") or uuid.uuid4().hex, "created_at": _now(), **m} for m in messages]
        await self.db.conversations.update_one(
            {"_id": conversation_id, "user_id": user_id},
            {"$push": {"messages": {"$each": stamped}}, "$set": {"updated_at": _now()}},
        )

    async def set_title(self, user_id: str, conversation_id: str, title: str) -> None:
        await self.db.conversations.update_one({"_id": conversation_id, "user_id": user_id}, {"$set": {"title": title[:80]}})

    async def set_feedback(self, user_id: str, message_id: str, rating: str) -> bool:
        res = await self.db.conversations.update_one(
            {"user_id": user_id, "messages.id": message_id},
            {"$set": {"messages.$.feedback": rating}},
        )
        return res.modified_count == 1

    def context_messages(self, conversation: dict[str, Any]) -> list[dict[str, str]]:
        """Recent turns for the model (user/assistant text only; tool traces stay out of the context)."""
        recent = conversation["messages"][-self.settings.history_messages:]
        out = []
        for m in recent:
            if m["role"] not in ("user", "assistant") or not m.get("content"):
                continue
            content = m["content"]
            # Earlier answers only need their gist; full numbers are re-fetched with tools when needed.
            if m["role"] == "assistant" and len(content) > 700:
                content = content[:700] + " …"
            out.append({"role": m["role"], "content": content})
        return out

    async def maybe_summarize(self, user_id: str, conversation_id: str, llm: LLMClient) -> None:
        """Fold turns that have scrolled out of the recent window into the rolling summary."""
        conv = await self.get(user_id, conversation_id)
        if not conv:
            return
        messages = conv["messages"]
        cutoff = len(messages) - self.settings.history_messages
        start = conv.get("summarized_upto", 0)
        if cutoff - start < self.settings.summarize_after_messages - self.settings.history_messages:
            return
        old = messages[start:cutoff]
        transcript = "\n".join(f"{m['role'].upper()}: {m['content'][:800]}" for m in old if m.get("content"))
        prompt = [
            {"role": "system", "content": (
                "You maintain a running summary of a conversation between a user and an investing assistant. "
                "Merge the new turns into the existing summary. Keep facts the user stated, stocks discussed, "
                "decisions, open questions and numbers that matter. Under 200 words, plain text."
            )},
            {"role": "user", "content": f"Existing summary:\n{conv.get('summary') or '(none)'}\n\nNew turns:\n{transcript}"},
        ]
        summary = (await llm.complete(prompt, max_tokens=400)).strip()
        if summary:
            await self.db.conversations.update_one(
                {"_id": conversation_id, "user_id": user_id},
                {"$set": {"summary": summary, "summarized_upto": cutoff}},
            )
