"""Retrieval (RAG) and memory tools."""
from typing import Any

from .registry import Tool, ToolContext


async def search_knowledge(ctx: ToolContext, query: str) -> dict[str, Any]:
    hits = await ctx.knowledge.search(query, k=4)
    if not hits:
        return {"results": [], "note": "Nothing relevant in the SmartStock knowledge base; answer from general knowledge and say so."}
    results = []
    for i, hit in enumerate(hits, start=1):
        source = {"id": i, "title": hit.chunk.doc, "section": hit.chunk.section, "path": hit.chunk.source}
        if not any(s["path"] == source["path"] and s["section"] == source["section"] for s in ctx.sources):
            ctx.sources.append(source)
        results.append({"source": f"{hit.chunk.doc} › {hit.chunk.section}", "relevance": round(hit.score, 2), "text": hit.chunk.text})
    return {"results": results}


async def remember_user_fact(ctx: ToolContext, fact: str, category: str = "fact") -> dict[str, Any]:
    doc = await ctx.memory.add(ctx.user.id, fact, category, "explicit", ctx.conversation_id)
    if not doc:
        return {"error": "Could not save that"}
    ctx.saved_memories.append(doc["text"])
    return {"saved": doc["text"], "category": doc["category"]}


TOOLS = [
    Tool("search_knowledge",
         "Search SmartStock's curated knowledge base (Indian tax on equity, SEBI/NSE rules, IPO process, order types, ratios, technical analysis, portfolio risk, mutual funds/SIP, corporate actions, how SmartStock works). Use for concept, rule and how-to questions, and ground your answer in the results.",
         {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}, search_knowledge, "Searching the knowledge base"),
    Tool("remember_user_fact",
         "Save a durable fact about the user to long-term memory (goal, horizon, risk appetite, experience, preference, plan). Use when the user shares something that should shape future advice. Never store sensitive identifiers.",
         {"type": "object", "properties": {
             "fact": {"type": "string", "description": "One short third-person sentence, e.g. 'Saving for a house in 5 years'"},
             "category": {"type": "string", "enum": ["goal", "risk_profile", "preference", "experience", "plan", "fact"]}},
             "required": ["fact"]},
         remember_user_fact, "Saving to memory"),
]
