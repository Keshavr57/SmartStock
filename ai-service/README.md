# FinSage — SmartStock's AI advisor

An independent FastAPI service that runs a tool-using LLM agent over the user's SmartStock account. It has
long-term memory and retrieval-augmented answers. The Node backend doesn't know it exists. The browser talks to it
directly with the same login token, and the agent reads the account through the backend's REST API as that user.

```
Browser ──(JWT, SSE)──▶ FinSage (this service) ──(same JWT)──▶ SmartStock backend ──▶ MongoDB (SmartStock)
                              │
                              ├── Groq LLM (gpt-oss-120b, fallback gpt-oss-20b), tool calling
                              ├── MongoDB (SmartStockAI): conversations, memories, feedback
                              └── Knowledge base: markdown guides → bge-small embeddings + BM25
```

## What happens on a message

1. **Auth.** The bearer token is verified with the backend's `JWT_SECRET`. The agent can only see that user's data
   because every backend call carries their token.
2. **Context.** The system prompt is built from:
   - live market status;
   - long-term memories relevant to the question (always including goals, risk profile and preferences);
   - a rolling summary of older turns;
   - the last 10 messages.
3. **Agent loop** (up to 6 rounds):
   - The model streams text or tool calls.
   - Tools run and their results go back to the model.
   - Tool activity, answer tokens, sources and order drafts reach the browser as Server-Sent Events.
4. **After the turn** (in the background):
   - New facts the user stated are extracted into long-term memory. They are embedded and de-duplicated.
   - Long conversations are summarised.
   - New chats get a title.

## Tools (16)

| Area | Tools |
|------|-------|
| Account | account overview, holdings with weights, order history, watchlist, **Portfolio Doctor** (HHI, effective holdings, sector and beta exposure, 0–100 diversification score; computed in code, not by the LLM) |
| Market | quote, fundamentals, price history (return, drawdown, volatility), compare stocks, search, market overview, news, IPOs |
| Knowledge | `search_knowledge` (RAG with citations), `remember_user_fact` |
| Action | `propose_order`: builds a draft with cost, charges, cash after the order and warnings. **It never places the order.** The user confirms it in the UI. |

## Safety and grounding

- **Grounded numbers.** Every number must come from a tool result.
- **Explaining moves.** Price moves are explained only from fetched news, and news text is treated as untrusted
  data (prompt-injection guard).
- **Human-in-the-loop trading.** The agent cannot place orders; only the user's Confirm click can.
- **Language.** Replies follow the user's language: English, Hinglish or Hindi, detected deterministically.

## RAG

`knowledge/guides/*.md` holds curated guides: tax, order types, IPOs, valuation, risk, SIPs, corporate actions,
the platform and more. `knowledge/lessons/*.md` is exported from the Learn section by `scripts/sync_lessons.py`.

- **Chunking.** Documents are split by heading into chunks of at most 900 characters.
- **Embedding.** Chunks are embedded with `BAAI/bge-small-en-v1.5` (fastembed, runs locally on CPU) and cached in
  `.cache/`.
- **Ranking.** Results are ranked by hybrid score `0.7·cosine + 0.3·BM25/(BM25+4)`.
- **Cut-off.** Results scoring below 0.35 are dropped, so off-topic questions get no fake citations.

## API

| Method | Path | |
|--------|------|-|
| POST | `/v1/chat` | `{message, conversation_id?}` → SSE stream (`conversation`, `status`, `tool_start`, `tool_end`, `token`, `sources`, `proposal`, `memory`, `done`, `error`) |
| GET / DELETE | `/v1/conversations[/{id}]` | history |
| GET / DELETE | `/v1/memories[/{id}]` | what the advisor remembers (user-visible and deletable) |
| POST | `/v1/messages/{id}/feedback` | thumbs up/down |
| GET | `/v1/starters` | suggested questions personalised from holdings |
| GET | `/health` | model, tools, knowledge chunk count |

## Run locally

```bash
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # fill GROQ_API_KEY, JWT_SECRET (same as server/.env), MONGO_URI
.venv/bin/uvicorn app.main:app --port 8000
.venv/bin/pytest -q         # 23 tests: auth, analytics, RAG, language, agent loop with a scripted LLM
```

The client reads the service URL from `VITE_AI_SERVICE_URL` (default `http://localhost:8000`).

## Limits

Groq's free tier allows about 8,000 tokens per minute per model. The service:

- backs off using the `retry-after` header;
- falls back to the 20b model;
- runs background jobs on the smaller model.

Heavy use still benefits from Groq's paid developer tier.
