"""Portfolio Doctor: deterministic diagnostics the agent explains in plain language.

All numbers are computed here, not by the language model, so they are exact and testable.
"""
from dataclasses import dataclass, field
from typing import Any

# Thresholds from common retail portfolio guidance (see knowledge/guides/portfolio-and-risk.md).
MAX_STOCK_WEIGHT = 0.15
MAX_SECTOR_WEIGHT = 0.30
MIN_HOLDINGS_FOR_DIVERSIFICATION = 8
HIGH_CASH = 0.5
LOW_CASH = 0.03
HIGH_BETA = 1.2


@dataclass
class Finding:
    severity: str  # "high" | "medium" | "low" | "good"
    title: str
    detail: str


@dataclass
class PortfolioReport:
    total_value: float
    cash: float
    invested_value: float
    cash_weight: float
    holdings_count: int
    hhi: float | None
    effective_holdings: float | None
    largest_position: dict[str, Any] | None
    sector_weights: list[dict[str, Any]]
    weighted_beta: float | None
    unrealised_pnl: float
    winners: list[dict[str, Any]]
    losers: list[dict[str, Any]]
    diversification_score: int
    findings: list[Finding] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "total_value": round(self.total_value, 2),
            "cash": round(self.cash, 2),
            "invested_value": round(self.invested_value, 2),
            "cash_weight_pct": round(self.cash_weight * 100, 1),
            "holdings_count": self.holdings_count,
            "hhi": None if self.hhi is None else round(self.hhi, 3),
            "effective_number_of_holdings": None if self.effective_holdings is None else round(self.effective_holdings, 1),
            "largest_position": self.largest_position,
            "sector_weights": self.sector_weights,
            "weighted_beta": None if self.weighted_beta is None else round(self.weighted_beta, 2),
            "unrealised_pnl": round(self.unrealised_pnl, 2),
            "top_winners": self.winners,
            "top_losers": self.losers,
            "diversification_score_0_to_100": self.diversification_score,
            "findings": [f.__dict__ for f in self.findings],
        }


def analyze(holdings: list[dict[str, Any]], cash: float, enrichment: dict[str, dict[str, Any]] | None = None) -> PortfolioReport:
    """
    holdings: backend /trading/holdings rows (symbol, sector, quantity, invested, currentValue, pnl, pnlPercent).
    enrichment: optional per-symbol fundamentals (sector, beta) to fill gaps.
    """
    enrichment = enrichment or {}
    rows = []
    for h in holdings:
        value = h.get("currentValue") if h.get("currentValue") is not None else h.get("invested", 0)
        extra = enrichment.get(h["symbol"], {})
        sector = h.get("sector") if h.get("sector") not in (None, "Other") else extra.get("sector") or "Other"
        rows.append({
            "symbol": h["symbol"],
            "value": float(value or 0),
            "pnl": float(h.get("pnl") or 0),
            "pnl_pct": h.get("pnlPercent"),
            "sector": sector,
            "beta": extra.get("beta"),
        })

    invested_value = sum(r["value"] for r in rows)
    total = invested_value + cash
    cash_weight = cash / total if total > 0 else 1.0
    findings: list[Finding] = []

    hhi = effective = None
    largest = None
    sector_weights: list[dict[str, Any]] = []
    weighted_beta = None
    if invested_value > 0:
        weights = {r["symbol"]: r["value"] / invested_value for r in rows}
        hhi = sum(w * w for w in weights.values())
        effective = 1 / hhi if hhi > 0 else None
        top = max(rows, key=lambda r: r["value"])
        largest = {"symbol": top["symbol"], "weight_pct": round(weights[top["symbol"]] * 100, 1)}

        by_sector: dict[str, float] = {}
        for r in rows:
            by_sector[r["sector"]] = by_sector.get(r["sector"], 0) + r["value"]
        sector_weights = sorted(
            ({"sector": s, "weight_pct": round(v / invested_value * 100, 1)} for s, v in by_sector.items()),
            key=lambda x: -x["weight_pct"],
        )

        with_beta = [r for r in rows if isinstance(r["beta"], (int, float))]
        covered = sum(r["value"] for r in with_beta)
        if with_beta and covered / invested_value >= 0.6:
            weighted_beta = sum(r["beta"] * r["value"] for r in with_beta) / covered

        # --- findings ---
        if weights[top["symbol"]] > MAX_STOCK_WEIGHT and len(rows) > 1:
            findings.append(Finding("high" if weights[top["symbol"]] > 0.3 else "medium",
                f"{top['symbol']} is {weights[top['symbol']] * 100:.0f}% of your stock holdings",
                f"Common guidance keeps any single stock under {MAX_STOCK_WEIGHT * 100:.0f}% so one bad result can't sink the portfolio."))
        heavy = [s for s in sector_weights if s["weight_pct"] > MAX_SECTOR_WEIGHT * 100 and s["sector"] != "Other"]
        for s in heavy[:2]:
            findings.append(Finding("medium",
                f"{s['sector']} is {s['weight_pct']:.0f}% of your holdings",
                "Stocks in one sector tend to fall together; consider spreading across more sectors."))
        if len(rows) < MIN_HOLDINGS_FOR_DIVERSIFICATION:
            findings.append(Finding("medium" if len(rows) < 4 else "low",
                f"Only {len(rows)} stock{'s' if len(rows) != 1 else ''} held",
                f"Roughly 15 to 25 stocks across 6+ sectors removes most company-specific risk; an index fund is a simple alternative."))
        if weighted_beta is not None and weighted_beta > HIGH_BETA:
            findings.append(Finding("medium", f"High market sensitivity (beta {weighted_beta:.2f})",
                "Your holdings tend to move more than the market in both directions."))
        losers_total = sum(r["pnl"] for r in rows if r["pnl"] < 0)
        if invested_value and losers_total / invested_value < -0.15:
            findings.append(Finding("medium", "Losses are concentrated",
                f"Positions in the red total ₹{abs(losers_total):,.0f}. Re-check whether the original reason for each still holds."))

    if cash_weight > HIGH_CASH:
        findings.append(Finding("low", f"{cash_weight * 100:.0f}% of your account is cash",
            "That keeps risk low but also limits returns; deploying gradually (for example in monthly instalments) avoids timing risk."))
    elif cash_weight < LOW_CASH and invested_value > 0:
        findings.append(Finding("low", "Almost fully invested",
            "Keeping a small cash buffer lets you add on dips without selling."))
    if invested_value > 0 and not findings:
        findings.append(Finding("good", "Well balanced", "No concentration, sector or cash issues stand out."))

    score = _diversification_score(effective, sector_weights, len(rows))
    ranked = sorted(rows, key=lambda r: r["pnl"])
    as_row = lambda r: {"symbol": r["symbol"], "pnl": round(r["pnl"], 2), "pnl_pct": r["pnl_pct"]}
    return PortfolioReport(
        total_value=total, cash=cash, invested_value=invested_value, cash_weight=cash_weight,
        holdings_count=len(rows), hhi=hhi, effective_holdings=effective, largest_position=largest,
        sector_weights=sector_weights, weighted_beta=weighted_beta,
        unrealised_pnl=sum(r["pnl"] for r in rows),
        winners=[as_row(r) for r in reversed(ranked) if r["pnl"] > 0][:3],
        losers=[as_row(r) for r in ranked if r["pnl"] < 0][:3],
        diversification_score=score, findings=findings,
    )


def _diversification_score(effective: float | None, sector_weights: list[dict[str, Any]], count: int) -> int:
    """0–100: 60 points for effective number of holdings (saturating at 15), 40 for sector spread."""
    if not count or effective is None:
        return 0
    holdings_part = min(effective / 15, 1) * 60
    top_sector = sector_weights[0]["weight_pct"] / 100 if sector_weights else 1
    sectors = len([s for s in sector_weights if s["weight_pct"] >= 5])
    sector_part = (min(sectors / 6, 1) * 0.6 + (1 - top_sector) * 0.4) * 40
    return int(round(holdings_part + sector_part))
