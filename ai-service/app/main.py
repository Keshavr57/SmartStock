"""FinSage AI service: SmartStock's independent AI advisor (agent + memory + RAG)."""
import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .agent.orchestrator import REGISTRY, Agent
from .config import get_settings
from .llm import LLMClient
from .memory.conversations import ConversationStore
from .memory.long_term import MemoryStore
from .rag.knowledge_base import get_knowledge_base
from .routers import account, chat

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("finsage")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # Building the knowledge index embeds every chunk once (cached on disk afterwards).
    kb = await asyncio.to_thread(get_knowledge_base)
    log.info("Knowledge base ready: %d chunks", len(kb.chunks))
    try:
        await db.ensure_indexes()
    except Exception as exc:  # the service still answers stateless questions if Mongo is down
        log.warning("MongoDB unavailable at startup: %s", exc)
    llm = LLMClient()
    app.state.conversations = ConversationStore()
    app.state.memory = MemoryStore()
    app.state.agent = Agent(llm, app.state.conversations, app.state.memory, kb)
    app.state.kb = kb
    log.info("FinSage ready with %d tools, model %s", len(REGISTRY.tools), settings.llm_model)
    yield
    await app.state.agent.drain()
    await llm.aclose()
    db.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="FinSage AI Service", version="2.0.0", lifespan=lifespan,
                  description="SmartStock's AI advisor: tool-using agent with long-term memory and retrieval.")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(chat.router)
    app.include_router(account.router)

    @app.get("/health")
    async def health():
        kb = getattr(app.state, "kb", None)
        return {"status": "ok", "model": settings.llm_model, "tools": sorted(REGISTRY.tools),
                "knowledge_chunks": len(kb.chunks) if kb else 0}

    @app.get("/")
    async def root():
        return {"service": "FinSage AI", "docs": "/docs", "health": "/health"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
