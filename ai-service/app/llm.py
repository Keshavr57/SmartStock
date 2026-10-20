"""Streaming client for an OpenAI-compatible chat API (Groq), with tool calling and model fallback."""
import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

import httpx

from .config import get_settings


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: str = ""

    def parsed_arguments(self) -> dict[str, Any]:
        try:
            value = json.loads(self.arguments or "{}")
            return value if isinstance(value, dict) else {}
        except json.JSONDecodeError:
            return {}


@dataclass
class LLMEvent:
    type: str  # "text" | "tool_calls" | "done"
    text: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    model: str = ""
    usage: dict[str, Any] | None = None


class LLMError(Exception):
    pass


RETRYABLE = {429, 500, 502, 503, 504}
MAX_RETRY_WAIT_S = 8.0


def _retry_after(res: httpx.Response) -> float:
    """Seconds to wait before retrying, from Groq's retry-after header (capped); 1s if absent."""
    try:
        return min(float(res.headers.get("retry-after", "1")), MAX_RETRY_WAIT_S)
    except ValueError:
        return 1.0


class LLMClient:
    def __init__(self, http: httpx.AsyncClient | None = None):
        self.settings = get_settings()
        self._http = http or httpx.AsyncClient(
            base_url=self.settings.groq_base_url,
            headers={"Authorization": f"Bearer {self.settings.groq_api_key}"},
            timeout=httpx.Timeout(90.0, connect=10.0),
        )

    async def aclose(self) -> None:
        await self._http.aclose()

    def _body(self, model: str, messages: list[dict], tools: list[dict] | None, stream: bool, **extra) -> dict:
        body: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": extra.pop("temperature", self.settings.llm_temperature),
            "max_tokens": extra.pop("max_tokens", self.settings.llm_max_tokens),
            "stream": stream,
            **extra,
        }
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"
        if model.startswith("openai/gpt-oss"):
            # Reasoning models: keep latency low for a chat product.
            body.setdefault("reasoning_effort", "low")
        return body

    async def stream(self, messages: list[dict], tools: list[dict] | None = None) -> AsyncIterator[LLMEvent]:
        """Yields text deltas as they arrive, then one tool_calls event (if any), then done."""
        # Each model gets one short backoff retry on rate limits before falling back to the next.
        attempts = [self.settings.llm_model, self.settings.llm_model, self.settings.llm_fallback_model, self.settings.llm_fallback_model]
        last_error = "LLM unavailable"
        wait = 0.0
        for model in attempts:
            if wait:
                await asyncio.sleep(wait)
                wait = 0.0
            calls: dict[int, ToolCall] = {}
            emitted_text = False
            try:
                async with self._http.stream("POST", "/chat/completions", json=self._body(model, messages, tools, True)) as res:
                    if res.status_code in RETRYABLE:
                        last_error = f"{model} returned {res.status_code}"
                        wait = _retry_after(res)
                        continue
                    if res.status_code >= 400:
                        detail = (await res.aread()).decode(errors="ignore")[:300]
                        raise LLMError(f"LLM request failed ({res.status_code}): {detail}")
                    usage = None
                    async for line in res.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        payload = line[6:].strip()
                        if payload == "[DONE]":
                            break
                        chunk = json.loads(payload)
                        if chunk.get("x_groq", {}).get("usage"):
                            usage = chunk["x_groq"]["usage"]
                        choice = (chunk.get("choices") or [{}])[0]
                        delta = choice.get("delta") or {}
                        if delta.get("content"):
                            emitted_text = True
                            yield LLMEvent("text", text=delta["content"], model=model)
                        for tc in delta.get("tool_calls") or []:
                            call = calls.setdefault(tc["index"], ToolCall(id=tc.get("id") or f"call_{tc['index']}", name=""))
                            fn = tc.get("function") or {}
                            call.name += fn.get("name") or ""
                            call.arguments += fn.get("arguments") or ""
                            if tc.get("id"):
                                call.id = tc["id"]
                    if calls:
                        yield LLMEvent("tool_calls", tool_calls=[calls[i] for i in sorted(calls)], model=model)
                    yield LLMEvent("done", model=model, usage=usage)
                    return
            except httpx.HTTPError as exc:
                last_error = f"{model}: {exc.__class__.__name__}"
                # Never switch models halfway through a visible answer.
                if emitted_text:
                    raise LLMError(last_error) from exc
        raise LLMError(f"All models unavailable ({last_error})")

    async def complete(self, messages: list[dict], *, json_mode: bool = False, max_tokens: int = 800) -> str:
        """Non-streaming completion for background jobs (memory extraction, summaries, titles)."""
        extra: dict[str, Any] = {"max_tokens": max_tokens, "temperature": 0.1}
        if json_mode:
            extra["response_format"] = {"type": "json_object"}
        last_error = "LLM unavailable"
        for model in [self.settings.llm_fallback_model, self.settings.llm_model]:
            try:
                res = await self._http.post("/chat/completions", json=self._body(model, messages, None, False, **extra))
            except httpx.HTTPError as exc:
                last_error = exc.__class__.__name__
                continue
            if res.status_code in RETRYABLE:
                last_error = f"{model} returned {res.status_code}"
                continue
            if res.status_code >= 400:
                raise LLMError(f"LLM request failed ({res.status_code})")
            return res.json()["choices"][0]["message"].get("content") or ""
        raise LLMError(last_error)
