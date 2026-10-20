import json

from app.agent.prompts import detect_language
from app.agent.tools.registry import Tool, ToolContext, ToolRegistry, normalize_symbol
from app.auth import CurrentUser
from app.backend import BackendError


def test_language_detection():
    assert detect_language("Mujhe TCS bechna chahiye ya hold karna chahiye?") == "hinglish"
    assert detect_language("मुझे क्या करना चाहिए") == "hindi"
    assert detect_language("Should I buy TCS?") == "english"


def test_symbol_normalisation():
    assert normalize_symbol("tcs") == "TCS.NS"
    assert normalize_symbol("M&M") == "M&M.NS"
    assert normalize_symbol("^NSEI") == "^NSEI"
    assert normalize_symbol("RELIANCE.BO") == "RELIANCE.BO"


def ctx():
    return ToolContext(user=CurrentUser("u1", None, "t"), backend=None, conversation_id="c1")


async def test_registry_drops_undeclared_arguments_and_reports_errors():
    async def echo(c, symbol):
        return {"symbol": symbol}

    async def broken(c):
        raise BackendError("backend down", 503)

    reg = ToolRegistry([
        Tool("echo", "", {"type": "object", "properties": {"symbol": {"type": "string"}}}, echo, "Echo"),
        Tool("broken", "", {"type": "object", "properties": {}}, broken, "Broken"),
    ])
    ok, out = await reg.run("echo", {"symbol": "TCS", "unexpected": 1}, ctx())
    assert ok and json.loads(out) == {"symbol": "TCS"}
    ok, out = await reg.run("broken", {}, ctx())
    assert not ok and "backend down" in out
    ok, out = await reg.run("missing", {}, ctx())
    assert not ok
    assert reg.label("echo", {"symbol": "TCS.NS"}) == "Echo TCS"
