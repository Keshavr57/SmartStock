"""Tools over the signed-in user's own (virtual) account."""
import asyncio
from typing import Any

from ...backend import BackendError
from ..portfolio_analytics import analyze
from .registry import Tool, ToolContext, normalize_symbol, pick, symbol_display

FEE_RATE = 0.001  # mirrors the backend's 0.1% per order


async def get_account_overview(ctx: ToolContext) -> dict[str, Any]:
    p = await ctx.backend.portfolio()
    return {
        "note": "Virtual paper-trading account (no real money).",
        **pick(p, ["totalValue", "availableBalance", "totalInvested", "currentValue", "totalPnL", "totalPnLPercent",
                   "dayPnL", "dayPnLPercent", "holdingsCount", "transactionsCount"]),
        "stale_price_symbols": p.get("stalePrices") or [],
    }


async def get_holdings(ctx: ToolContext) -> dict[str, Any]:
    rows = await ctx.backend.holdings()
    total = sum((h.get("currentValue") or h.get("invested") or 0) for h in rows) or 1
    holdings = [
        {"symbol": symbol_display(h["symbol"]),
         **pick(h, ["name", "sector", "quantity", "avgPrice", "currentPrice", "invested", "currentValue", "pnl", "pnlPercent", "dayPnL"]),
         # Precomputed so the model never has to do arithmetic on positions.
         "weight_pct_of_holdings": round((h.get("currentValue") or h.get("invested") or 0) / total * 100, 1)}
        for h in rows
    ]
    return {"count": len(holdings), "holdings_value": round(total, 2), "holdings": holdings}


async def get_order_history(ctx: ToolContext, limit: int = 20, symbol: str | None = None) -> dict[str, Any]:
    orders = await ctx.backend.orders(limit=200 if symbol else min(max(int(limit), 1), 100))
    if symbol:
        target = normalize_symbol(symbol)
        orders = [o for o in orders if o["symbol"] == target][: int(limit)]
    realised = sum(o.get("realizedPnL") or 0 for o in orders)
    return {
        "count": len(orders),
        "realised_pnl_in_these_orders": round(realised, 2),
        "orders": [
            {"date": str(o["timestamp"])[:16], "side": o["type"], "symbol": symbol_display(o["symbol"]),
             **pick(o, ["quantity", "price", "totalAmount", "fees", "realizedPnL"])}
            for o in orders
        ],
    }


async def get_watchlist(ctx: ToolContext) -> dict[str, Any]:
    items = await ctx.backend.watchlist()
    return {"watchlist": [{"symbol": symbol_display(w["symbol"]), **pick(w, ["name", "price", "changePercent"])} for w in items]}


async def analyze_portfolio(ctx: ToolContext) -> dict[str, Any]:
    portfolio, holdings = await asyncio.gather(ctx.backend.portfolio(), ctx.backend.holdings())
    # Beta (and missing sectors) come from fundamentals; fetch in parallel, tolerate gaps.
    async def enrich(symbol: str):
        try:
            f = await ctx.backend.fundamentals(symbol)
            return symbol, {"beta": f.get("beta"), "sector": f.get("sector")}
        except BackendError:
            return symbol, {}
    enrichment = dict(await asyncio.gather(*(enrich(h["symbol"]) for h in holdings[:20])))
    report = analyze(holdings, float(portfolio.get("availableBalance") or 0), enrichment)
    return {
        "method": "Concentration via Herfindahl index of position weights; score 0-100 = 60 pts effective holdings (saturates at 15) + 40 pts sector spread.",
        **report.as_dict(),
    }


async def propose_order(ctx: ToolContext, symbol: str, side: str, quantity: int, reason: str = "") -> dict[str, Any]:
    """Builds an order draft for the user to confirm in the UI. Never executes anything."""
    side = side.upper()
    if side not in ("BUY", "SELL"):
        return {"error": "side must be BUY or SELL"}
    qty = int(quantity)
    if qty < 1:
        return {"error": "quantity must be at least 1"}
    sym = normalize_symbol(symbol)
    quote, portfolio, holdings = await asyncio.gather(ctx.backend.quote(sym), ctx.backend.portfolio(), ctx.backend.holdings())
    price = quote.get("price")
    if not price:
        return {"error": f"No live price for {symbol_display(sym)}"}
    value = price * qty
    charges = value * FEE_RATE
    cash = float(portfolio.get("availableBalance") or 0)
    held = next((h["quantity"] for h in holdings if h["symbol"] == sym), 0)
    warnings = []
    if side == "BUY" and value + charges > cash:
        warnings.append(f"Needs ₹{value + charges:,.2f} but only ₹{cash:,.2f} cash is available.")
    if side == "SELL" and qty > held:
        warnings.append(f"You hold {held} shares of {symbol_display(sym)}.")
    if side == "BUY" and cash > 0 and (value / (float(portfolio.get('totalValue') or cash))) > 0.2:
        warnings.append("This single order would be over 20% of your account value.")
    draft = {
        "symbol": sym,
        "name": quote.get("name"),
        "side": side,
        "quantity": qty,
        "estimated_price": round(price, 2),
        "estimated_value": round(value, 2),
        "estimated_charges": round(charges, 2),
        "estimated_total": round(value + charges if side == "BUY" else value - charges, 2),
        "cash_available": round(cash, 2),
        "cash_after_order": round(cash - (value + charges) if side == "BUY" else cash + (value - charges), 2),
        "shares_held": held,
        "charges_note": "SmartStock charges a flat 0.1% per order to approximate brokerage and statutory charges.",
        "reason": reason[:200],
        "warnings": warnings,
        "executable": not any("Needs" in w or "You hold" in w for w in warnings),
    }
    ctx.proposals.append(draft)
    return {"status": "draft_shown_to_user_for_confirmation", "draft": draft,
            "instruction": "Tell the user to review and confirm the order card. You have NOT placed this order."}


TOOLS = [
    Tool("get_account_overview",
         "The user's virtual account summary: total value, cash, invested amount, total and today's P&L. Use for any question about their balance, value or overall performance.",
         {"type": "object", "properties": {}}, get_account_overview, "Checking your account"),
    Tool("get_holdings",
         "The user's current stock holdings with quantity, average cost, live price, value, P&L and day P&L.",
         {"type": "object", "properties": {}}, get_holdings, "Checking your holdings"),
    Tool("get_order_history",
         "The user's executed orders (buys and sells) with prices, charges and realised P&L on sells. Optionally filter by symbol.",
         {"type": "object", "properties": {
             "limit": {"type": "integer", "description": "Max orders, default 20"},
             "symbol": {"type": "string", "description": "NSE ticker to filter, e.g. TCS"}}},
         get_order_history, "Reading your order history"),
    Tool("get_watchlist", "Stocks on the user's watchlist with live prices.",
         {"type": "object", "properties": {}}, get_watchlist, "Checking your watchlist"),
    Tool("analyze_portfolio",
         "Portfolio Doctor: computes concentration (HHI, effective number of holdings), largest position, sector weights, weighted beta, cash share, winners/losers, a 0-100 diversification score and risk findings. Use when the user asks to review, diagnose or improve their portfolio, or about risk/diversification.",
         {"type": "object", "properties": {}}, analyze_portfolio, "Analysing your portfolio"),
    Tool("propose_order",
         "Prepare a BUY or SELL order draft for the user to review and confirm in the app. It does NOT place the order. Use only when the user explicitly wants to buy or sell.",
         {"type": "object", "properties": {
             "symbol": {"type": "string", "description": "NSE ticker, e.g. RELIANCE"},
             "side": {"type": "string", "enum": ["BUY", "SELL"]},
             "quantity": {"type": "integer", "minimum": 1},
             "reason": {"type": "string", "description": "One line on why, in the user's words"}},
             "required": ["symbol", "side", "quantity"]},
         propose_order, "Preparing an order for"),
]
