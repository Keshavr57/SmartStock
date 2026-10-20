import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from ..agent.orchestrator import Agent, sse
from ..auth import CurrentUser, current_user
from ..config import get_settings

router = APIRouter(prefix="/v1", tags=["chat"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = Field(default=None, max_length=64)


class RateLimiter:
    """Sliding-window limit per user (in-process; enough for a single instance)."""

    def __init__(self):
        self.hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, limit: int, window: float = 60.0) -> bool:
        now = time.monotonic()
        q = self.hits[key]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= limit:
            return False
        q.append(now)
        return True


limiter = RateLimiter()


@router.post("/chat")
async def chat(body: ChatRequest, request: Request, user: CurrentUser = Depends(current_user)):
    if not limiter.check(user.id, get_settings().rate_limit_per_minute):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "You're sending messages quickly; wait a few seconds.")
    agent: Agent = request.app.state.agent

    async def stream():
        async for event in agent.run(user, body.message.strip(), body.conversation_id):
            if await request.is_disconnected():
                break
            yield sse(event)

    return EventSourceResponse(stream(), ping=15)
