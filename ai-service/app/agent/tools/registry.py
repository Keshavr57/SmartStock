"""Tool registry: each tool is a JSON-schema function the model can call, plus an async handler."""
import json
import re
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

from ...auth import CurrentUser
from ...backend import BackendClient, BackendError

# Tool results are sent back to the model on every round; keep them compact (free-tier TPM is small).
MAX_RESULT_CHARS = 3500


@dataclass
class ToolContext:
    user: CurrentUser
    backend: BackendClient
    conversation_id: str
    memory: Any = None           # MemoryStore
    knowledge: Any = None        # KnowledgeBase
    # Side outputs the orchestrator streams to the UI and stores with the message.
    sources: list[dict[str, Any]] = field(default_factory=list)
    proposals: list[dict[str, Any]] = field(default_factory=list)
    saved_memories: list[str] = field(default_factory=list)


Handler = Callable[..., Awaitable[Any]]


@dataclass
class Tool:
    name: str
    description: str
    parameters: dict[str, Any]
    handler: Handler
    label: str  # shown to the user while the tool runs, e.g. "Checking your holdings"

    def schema(self) -> dict[str, Any]:
        return {"type": "function", "function": {"name": self.name, "description": self.description, "parameters": self.parameters}}


class ToolRegistry:
    def __init__(self, tools: list[Tool]):
        self.tools = {t.name: t for t in tools}

    def schemas(self) -> list[dict[str, Any]]:
        return [t.schema() for t in self.tools.values()]

    def label(self, name: str, args: dict[str, Any]) -> str:
        tool = self.tools.get(name)
        if not tool:
            return name
        symbol = args.get("symbol") or ", ".join(args.get("symbols") or [])
        return f"{tool.label} {symbol_display(symbol)}".strip() if symbol else tool.label

    async def run(self, name: str, args: dict[str, Any], ctx: ToolContext) -> tuple[bool, str]:
        """Returns (ok, JSON string for the model). Errors are reported to the model, never raised."""
        tool = self.tools.get(name)
        if tool is None:
            return False, json.dumps({"error": f"Unknown tool {name}"})
        # Models occasionally add arguments a tool doesn't declare; drop them rather than fail the call.
        declared = tool.parameters.get("properties", {})
        args = {k: v for k, v in args.items() if k in declared}
        try:
            result = await tool.handler(ctx, **args)
            ok = not (isinstance(result, dict) and "error" in result)
        except BackendError as exc:
            result, ok = {"error": str(exc)}, False
        except TypeError as exc:
            result, ok = {"error": f"Bad arguments for {name}: {exc}"}, False
        text = json.dumps(result, ensure_ascii=False, default=str)
        if len(text) > MAX_RESULT_CHARS:
            text = text[:MAX_RESULT_CHARS] + '…"(truncated)"'
        return ok, text


# ---- helpers shared by tool modules ----

def normalize_symbol(raw: str) -> str:
    """'tcs' -> 'TCS.NS'; keeps indices (^NSEI) and explicit exchanges (.NS/.BO)."""
    symbol = re.sub(r"\s+", "", str(raw or "")).upper()
    if not symbol:
        return symbol
    if symbol.startswith("^") or symbol.endswith((".NS", ".BO")):
        return symbol
    return f"{symbol}.NS"


def symbol_display(symbol: str) -> str:
    return re.sub(r"\.(NS|BO)\b", "", symbol).replace("^", "")


def r2(value: Any) -> Any:
    return round(value, 2) if isinstance(value, float) else value


def pick(data: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    """Subset with rounding and nulls dropped, to keep tool results compact for the model."""
    return {k: r2(data[k]) for k in keys if data.get(k) is not None}
