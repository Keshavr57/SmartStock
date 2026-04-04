from pydantic import BaseModel
from typing import List, Optional


class Message(BaseModel):
    role: str        # "user" or "assistant"
    content: str


class UserContext(BaseModel):
    name: Optional[str] = "User"
    portfolio: Optional[int] = 100000


class ChatRequest(BaseModel):
    messages: List[Message]
    userContext: Optional[UserContext] = None


class ChatResponse(BaseModel):
    reply: str
