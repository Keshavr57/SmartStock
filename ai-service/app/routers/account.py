"""Conversation history, long-term memory management, feedback and personalised starters."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..auth import CurrentUser, current_user
from ..backend import BackendClient, BackendError

router = APIRouter(prefix="/v1", tags=["account"])


def _iso(value):
    return value.isoformat() if hasattr(value, "isoformat") else value


@router.get("/conversations")
async def list_conversations(request: Request, user: CurrentUser = Depends(current_user)):
    docs = await request.app.state.conversations.list(user.id)
    return {"conversations": [
        {"id": d["_id"], "title": d["title"], "updated_at": _iso(d["updated_at"]),
         "preview": (d.get("messages") or [{}])[-1].get("content", "")[:120]}
        for d in docs
    ]}


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, request: Request, user: CurrentUser = Depends(current_user)):
    doc = await request.app.state.conversations.get(user.id, conversation_id)
    if not doc:
        raise HTTPException(404, "Conversation not found")
    return {
        "id": doc["_id"],
        "title": doc["title"],
        "messages": [
            {k: (_iso(v) if k == "created_at" else v) for k, v in m.items() if k in
             ("id", "role", "content", "tools", "sources", "proposals", "feedback", "created_at")}
            for m in doc["messages"]
        ],
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, request: Request, user: CurrentUser = Depends(current_user)):
    if not await request.app.state.conversations.delete(user.id, conversation_id):
        raise HTTPException(404, "Conversation not found")
    return {"deleted": True}


@router.get("/memories")
async def list_memories(request: Request, user: CurrentUser = Depends(current_user)):
    docs = await request.app.state.memory.list(user.id)
    return {"memories": [
        {"id": d["_id"], "text": d["text"], "category": d["category"], "source": d.get("source"), "created_at": _iso(d["created_at"])}
        for d in docs
    ]}


@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, request: Request, user: CurrentUser = Depends(current_user)):
    if not await request.app.state.memory.delete(user.id, memory_id):
        raise HTTPException(404, "Memory not found")
    return {"deleted": True}


@router.delete("/memories")
async def clear_memories(request: Request, user: CurrentUser = Depends(current_user)):
    return {"deleted": await request.app.state.memory.clear(user.id)}


class Feedback(BaseModel):
    rating: Literal["up", "down"]


@router.post("/messages/{message_id}/feedback")
async def feedback(message_id: str, body: Feedback, request: Request, user: CurrentUser = Depends(current_user)):
    if not await request.app.state.conversations.set_feedback(user.id, message_id, body.rating):
        raise HTTPException(404, "Message not found")
    return {"ok": True}


@router.get("/starters")
async def starters(user: CurrentUser = Depends(current_user)):
    """Suggested first questions, personalised from the account without calling the LLM."""
    backend = BackendClient(user.token)
    try:
        holdings = await backend.holdings()
    except BackendError:
        holdings = []
    finally:
        await backend.close()
    if holdings:
        top = max(holdings, key=lambda h: h.get("currentValue") or 0)
        name = top["symbol"].replace(".NS", "")
        items = [
            "Review my portfolio: how diversified is it?",
            f"Should I hold or trim {name}? Look at its fundamentals and news",
            "How did my trades do so far? Summarise my realised P&L",
            "Which IPOs are open or coming up this week?",
        ]
    else:
        items = [
            "I have ₹1 lakh of virtual cash. How should a beginner start?",
            "Compare TCS and INFY on valuation and growth",
            "How is tax calculated if I sell shares after 2 years?",
            "What's happening in the market today?",
        ]
    return {"starters": items}
