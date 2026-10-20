"""The agent loop.

One user turn:
  1. Build context: system prompt (date, market status, user's name, recalled long-term memories,
     rolling conversation summary) + recent messages + the new question.
  2. Stream the model. Text deltas go straight to the client; tool calls are executed in parallel and
     their results fed back, for up to `max_tool_rounds` rounds.
  3. Persist the turn (answer, tool trace, sources, order drafts) and schedule background work:
     long-term memory extraction, conversation title and rolling summary.

Events yielded (serialised as Server-Sent Events by the router):
  conversation · status · tool_start · tool_end · token · sources · proposal · memory · done · error
"""
import asyncio
import json
import logging
import time
import uuid
from collections.abc import AsyncIterator
from typing import Any

from ..auth import CurrentUser
from ..backend import BackendClient, BackendError
from ..config import get_settings
from ..llm import LLMClient, LLMError
from ..memory.conversations import ConversationStore
from ..memory.long_term import MemoryStore
from ..rag.knowledge_base import KnowledgeBase
from .prompts import LANGUAGE_INSTRUCTIONS, build_system_prompt, detect_language
from .tools import account, knowledge, market
from .tools.registry import ToolContext, ToolRegistry

log = logging.getLogger("finsage.agent")

REGISTRY = ToolRegistry(account.TOOLS + market.TOOLS + knowledge.TOOLS)

Event = dict[str, Any]


class Agent:
    def __init__(self, llm: LLMClient, conversations: ConversationStore, memory: MemoryStore, kb: KnowledgeBase,
                 registry: ToolRegistry = REGISTRY, backend_factory=BackendClient):
        self.llm = llm
        self.conversations = conversations
        self.memory = memory
        self.kb = kb
        self.registry = registry
        self.backend_factory = backend_factory
        self.settings = get_settings()
        # Strong references: asyncio only keeps weak ones, so unreferenced tasks can vanish mid-run.
        self._background: set[asyncio.Task] = set()

    async def _context(self, user: CurrentUser, backend: BackendClient, question: str) -> tuple[str | None, str | None, list[dict]]:
        """Fetch the user's name, market status and relevant memories concurrently; tolerate failures."""
        async def name():
            try:
                return (await backend.profile()).get("name")
            except BackendError:
                return None

        async def status():
            try:
                return (await backend.market_status()).get("status")
            except BackendError:
                return None

        async def memories():
            try:
                return await self.memory.recall(user.id, question)
            except Exception:  # memory is an enhancement; never block an answer on it
                log.exception("memory recall failed")
                return []

        return await asyncio.gather(name(), status(), memories())

    async def run(self, user: CurrentUser, message: str, conversation_id: str | None = None) -> AsyncIterator[Event]:
        started = time.monotonic()
        conversation = await self.conversations.get(user.id, conversation_id) if conversation_id else None
        is_new = conversation is None
        if is_new:
            conversation = await self.conversations.create(user.id, title=message[:60])
        conversation_id = conversation["_id"]
        yield {"event": "conversation", "data": {"conversation_id": conversation_id, "is_new": is_new}}

        backend = self.backend_factory(user.token)
        ctx = ToolContext(user=user, backend=backend, conversation_id=conversation_id, memory=self.memory, knowledge=self.kb)
        try:
            yield {"event": "status", "data": {"text": "Thinking"}}
            user_name, market_status, memories = await self._context(user, backend, message)
            system = build_system_prompt(
                user_name=user_name, market_status=market_status, memories=memories,
                conversation_summary=conversation.get("summary"),
            )
            messages: list[dict[str, Any]] = [
                {"role": "system", "content": system},
                *self.conversations.context_messages(conversation),
            ]
            language = detect_language(message)
            if language in LANGUAGE_INSTRUCTIONS:
                # Placed right before the question: reasoning models follow late instructions most reliably.
                messages.append({"role": "system", "content": LANGUAGE_INSTRUCTIONS[language]})
            messages.append({"role": "user", "content": message})

            answer = ""
            trace: list[dict[str, Any]] = []
            for round_no in range(self.settings.max_tool_rounds + 1):
                # On the last round tools are withheld so the model must answer with what it has.
                tools = self.registry.schemas() if round_no < self.settings.max_tool_rounds else None
                calls = []
                round_text = ""
                async for ev in self.llm.stream(messages, tools=tools):
                    if ev.type == "text":
                        round_text += ev.text
                        yield {"event": "token", "data": {"text": ev.text}}
                    elif ev.type == "tool_calls":
                        calls = ev.tool_calls
                answer += round_text
                if not calls:
                    break

                messages.append({
                    "role": "assistant",
                    "content": round_text or None,
                    "tool_calls": [{"id": c.id, "type": "function", "function": {"name": c.name, "arguments": c.arguments or "{}"}} for c in calls],
                })
                for c in calls:
                    yield {"event": "tool_start", "data": {"id": c.id, "name": c.name, "label": self.registry.label(c.name, c.parsed_arguments())}}
                results = await asyncio.gather(*(self.registry.run(c.name, c.parsed_arguments(), ctx) for c in calls))
                for c, (ok, content) in zip(calls, results):
                    trace.append({"name": c.name, "args": c.parsed_arguments(), "ok": ok})
                    if not ok:
                        log.warning("tool %s failed: %s", c.name, content[:300])
                    messages.append({"role": "tool", "tool_call_id": c.id, "content": content})
                    yield {"event": "tool_end", "data": {"id": c.id, "name": c.name, "ok": ok}}
            else:
                answer = answer or "I couldn't finish that within my step limit. Could you narrow the question?"

            if not answer.strip():
                answer = "Sorry, I couldn't put together an answer. Please try rephrasing."
                yield {"event": "token", "data": {"text": answer}}

            if ctx.sources:
                yield {"event": "sources", "data": {"sources": ctx.sources}}
            for draft in ctx.proposals:
                yield {"event": "proposal", "data": draft}
            if ctx.saved_memories:
                yield {"event": "memory", "data": {"saved": ctx.saved_memories}}

            assistant_id = uuid.uuid4().hex
            await self.conversations.append(
                user.id, conversation_id,
                {"role": "user", "content": message},
                {"id": assistant_id, "role": "assistant", "content": answer, "tools": trace,
                 "sources": ctx.sources, "proposals": ctx.proposals,
                 "latency_ms": int((time.monotonic() - started) * 1000)},
            )
            yield {"event": "done", "data": {"conversation_id": conversation_id, "message_id": assistant_id}}

            task = asyncio.create_task(self._after_turn(user.id, conversation_id, message, answer, is_new))
            self._background.add(task)
            task.add_done_callback(self._background.discard)
        except LLMError as exc:
            log.warning("LLM failure: %s", exc)
            yield {"event": "error", "data": {"message": "The AI model is busy right now. Please try again in a moment."}}
        except Exception:
            log.exception("agent turn failed")
            yield {"event": "error", "data": {"message": "Something went wrong while answering. Please try again."}}
        finally:
            await backend.close()

    async def drain(self) -> None:
        """Wait for background jobs (used by tests and graceful shutdown)."""
        if self._background:
            await asyncio.gather(*self._background, return_exceptions=True)

    async def _after_turn(self, user_id: str, conversation_id: str, question: str, answer: str, is_new: bool) -> None:
        """Background work that must never affect the user's answer."""
        jobs = [self.memory.extract_and_store(user_id, conversation_id, question, answer, self.llm),
                self.conversations.maybe_summarize(user_id, conversation_id, self.llm)]
        if is_new:
            jobs.append(self._title(user_id, conversation_id, question))
        for result in await asyncio.gather(*jobs, return_exceptions=True):
            if isinstance(result, Exception):
                log.warning("post-turn job failed: %s", result)

    async def _title(self, user_id: str, conversation_id: str, question: str) -> None:
        title = await self.llm.complete([
            {"role": "system", "content": "Write a 3 to 6 word title for a chat that starts with this question. No quotes, no trailing punctuation."},
            {"role": "user", "content": question[:500]},
        ], max_tokens=200)  # reasoning models spend part of the budget thinking
        title = title.strip().strip('"').strip()
        if title:
            await self.conversations.set_title(user_id, conversation_id, title)


def sse(event: Event) -> dict[str, str]:
    return {"event": event["event"], "data": json.dumps(event["data"], ensure_ascii=False, default=str)}
