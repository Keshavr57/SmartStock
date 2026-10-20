"""Client for the SmartStock backend API.

Every call carries the signed-in user's own token, so the agent can only read (and propose actions on)
the account of the person it is talking to. The backend remains the single source of truth for
portfolio valuation, prices and fundamentals.
"""
from typing import Any
from urllib.parse import quote

import httpx

from .config import get_settings


class BackendError(Exception):
    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


class BackendClient:
    def __init__(self, token: str | None, client: httpx.AsyncClient | None = None):
        settings = get_settings()
        self._headers = {"Authorization": f"Bearer {token}"} if token else {}
        self._client = client or httpx.AsyncClient(base_url=settings.backend_url, timeout=25.0)
        self._owns_client = client is None

    async def close(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        try:
            res = await self._client.get(path, params=params, headers=self._headers)
        except httpx.HTTPError as exc:
            raise BackendError(f"SmartStock backend unreachable: {exc.__class__.__name__}") from exc
        if res.status_code >= 400:
            message = _error_message(res)
            raise BackendError(message, res.status_code)
        body = res.json()
        # Backend endpoints wrap payloads as {status, data} or {success, ...}.
        if isinstance(body, dict) and "data" in body and ("status" in body or "success" in body):
            return body["data"]
        return body

    async def post(self, path: str, json: dict[str, Any]) -> Any:
        try:
            res = await self._client.post(path, json=json, headers=self._headers)
        except httpx.HTTPError as exc:
            raise BackendError(f"SmartStock backend unreachable: {exc.__class__.__name__}") from exc
        if res.status_code >= 400:
            raise BackendError(_error_message(res), res.status_code)
        return res.json()

    # Convenience wrappers ---------------------------------------------------------------
    async def portfolio(self): return await self.get("/trading/portfolio")
    async def holdings(self): return await self.get("/trading/holdings")
    async def orders(self, limit: int = 50): return await self.get("/trading/transactions", {"limit": limit})
    async def watchlist(self): return await self.get("/trading/watchlist")
    async def market_status(self): return await self.get("/trading/market-status")
    async def quote(self, symbol: str): return await self.get(f"/trading/quote/{quote(symbol, safe='')}")
    async def quotes(self, symbols: list[str]): return await self.get("/trading/quotes", {"symbols": ",".join(symbols)})
    async def chart(self, symbol: str, timeframe: str): return await self.get(f"/trading/chart/{quote(symbol, safe='')}", {"timeframe": timeframe})
    async def fundamentals(self, symbol: str):
        body = await self.get(f"/fundamentals/{quote(symbol, safe='')}")
        return body.get("fundamentals", body) if isinstance(body, dict) else body
    async def search(self, q: str, limit: int = 6): return await self.get("/market/stocks/search", {"q": q, "limit": limit})
    async def top_movers(self): return await self.get("/market/top-movers")
    async def news(self): return await self.get("/news/trending")
    async def symbol_news(self, symbol: str): return await self.get(f"/news/symbol/{quote(symbol, safe='')}")
    async def ipos(self): return await self.get("/ipo")
    async def profile(self):
        body = await self.get("/auth/profile")
        return body.get("user", body) if isinstance(body, dict) else body


def _error_message(res: httpx.Response) -> str:
    try:
        body = res.json()
        return body.get("message") or body.get("error") or f"Backend error {res.status_code}"
    except ValueError:
        return f"Backend error {res.status_code}"
