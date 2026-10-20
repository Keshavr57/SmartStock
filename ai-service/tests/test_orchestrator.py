"""Agent loop tests with a scripted LLM, a fake backend and in-memory stores (no network, no database)."""
import json

from app.agent.orchestrator import Agent
from app.auth import CurrentUser
from app.llm import LLMEvent, ToolCall


class ScriptedLLM:
    """Plays back one list of events per model call and records what the agent sent."""

    def __init__(self, rounds):
        self.rounds = list(rounds)
        self.calls = []

    async def stream(self, messages, tools=None):
        self.calls.append({"messages": messages, "tools": tools})
        for event in self.rounds.pop(0):
            yield event

    async def complete(self, messages, **kwargs):
        return '{"memories": []}'


class FakeBackend:
    def __init__(self, token):
        self.posted = []

    async def close(self): pass
    async def profile(self): return {"name": "Aarav"}
    async def market_status(self): return {"status": "Market Closed (Holiday)"}
    async def portfolio(self): return {"totalValue": 100000, "availableBalance": 40000, "totalPnL": 1200, "holdingsCount": 2}
    async def holdings(self): return [{"symbol": "TCS.NS", "quantity": 2, "currentValue": 5000, "invested": 4800}]
    async def quote(self, symbol): return {"symbol": symbol, "name": "Infosys Limited", "price": 1000.0}
    async def post(self, path, json):
        self.posted.append(path)
        raise AssertionError("the agent must never place orders")


class MemoryConversations:
    def __init__(self):
        self.docs = {}

    async def create(self, user_id, title):
        doc = {"_id": "conv1", "user_id": user_id, "title": title, "summary": "", "messages": []}
        self.docs["conv1"] = doc
        return doc

    async def get(self, user_id, cid): return self.docs.get(cid)
    async def append(self, user_id, cid, *messages): self.docs[cid]["messages"].extend(messages)
    async def set_title(self, *a): pass
    async def maybe_summarize(self, *a): pass

    def context_messages(self, conv):
        return [{"role": m["role"], "content": m["content"]} for m in conv["messages"]]


class NoMemory:
    async def recall(self, user_id, query): return [{"category": "goal", "text": "Saving for a house in 5 years"}]
    async def extract_and_store(self, *a): return []


USER = CurrentUser("u1", "a@b.c", "token")


async def run(agent, message):
    events = [e async for e in agent.run(USER, message)]
    await agent.drain()
    return events


def make_agent(llm):
    return Agent(llm, MemoryConversations(), NoMemory(), kb=None, backend_factory=FakeBackend)


async def test_tool_round_then_streamed_answer():
    llm = ScriptedLLM([
        [LLMEvent("tool_calls", tool_calls=[ToolCall("c1", "get_account_overview", "{}")]), LLMEvent("done")],
        [LLMEvent("text", text="Your account is worth "), LLMEvent("text", text="**₹1,00,000**."), LLMEvent("done")],
    ])
    agent = make_agent(llm)
    events = await run(agent, "How much is my account worth?")
    kinds = [e["event"] for e in events]

    assert kinds[0] == "conversation"
    assert kinds.index("tool_start") < kinds.index("tool_end") < kinds.index("token") < kinds.index("done")
    assert "".join(e["data"]["text"] for e in events if e["event"] == "token") == "Your account is worth **₹1,00,000**."

    # The tool result went back to the model, and the system prompt carried name, memory and market status.
    second_call = llm.calls[1]["messages"]
    assert any(m["role"] == "tool" and json.loads(m["content"])["totalValue"] == 100000 for m in second_call)
    system = llm.calls[0]["messages"][0]["content"]
    assert "Aarav" in system and "Saving for a house" in system and "Holiday" in system

    stored = agent.conversations.docs["conv1"]["messages"]
    assert [m["role"] for m in stored] == ["user", "assistant"]
    assert stored[1]["tools"] == [{"name": "get_account_overview", "args": {}, "ok": True}]


async def test_order_requests_produce_a_draft_never_an_order():
    llm = ScriptedLLM([
        [LLMEvent("tool_calls", tool_calls=[ToolCall("c1", "propose_order", '{"symbol":"INFY","side":"BUY","quantity":5}')]), LLMEvent("done")],
        [LLMEvent("text", text="Review and confirm the order card."), LLMEvent("done")],
    ])
    agent = make_agent(llm)
    events = await run(agent, "Buy 5 Infosys")
    proposal = next(e["data"] for e in events if e["event"] == "proposal")
    assert proposal["symbol"] == "INFY.NS" and proposal["side"] == "BUY" and proposal["quantity"] == 5
    assert proposal["estimated_total"] == 5005.0  # 5 × ₹1,000 + 0.1%
    assert proposal["executable"] is True


async def test_hinglish_gets_an_explicit_language_instruction():
    llm = ScriptedLLM([[LLMEvent("text", text="Haan, bilkul."), LLMEvent("done")]])
    await run(make_agent(llm), "kya mujhe abhi invest karna chahiye?")
    messages = llm.calls[0]["messages"]
    assert messages[-1]["role"] == "user"
    assert messages[-2]["role"] == "system" and "Hinglish" in messages[-2]["content"]


async def test_last_round_withholds_tools_so_the_model_must_answer():
    loop = [LLMEvent("tool_calls", tool_calls=[ToolCall("c", "get_account_overview", "{}")]), LLMEvent("done")]
    llm = ScriptedLLM([loop] * 6 + [[LLMEvent("text", text="Here is what I found."), LLMEvent("done")]])
    agent = make_agent(llm)
    await run(agent, "loop forever")
    assert llm.calls[-1]["tools"] is None
    assert all(c["tools"] for c in llm.calls[:-1])
