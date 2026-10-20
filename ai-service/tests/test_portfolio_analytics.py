from app.agent.portfolio_analytics import analyze


def h(symbol, value, sector, pnl=0.0):
    return {"symbol": symbol, "currentValue": value, "invested": value - pnl, "pnl": pnl, "pnlPercent": None, "sector": sector}


def test_concentrated_portfolio_is_flagged():
    report = analyze([h("RELIANCE.NS", 70000, "Oil & Gas"), h("TCS.NS", 30000, "IT")], cash=0)
    assert round(report.hhi, 2) == 0.58            # 0.7² + 0.3²
    assert round(report.effective_holdings, 2) == 1.72
    assert report.largest_position == {"symbol": "RELIANCE.NS", "weight_pct": 70.0}
    severities = {f.title: f.severity for f in report.findings}
    assert any("RELIANCE.NS is 70%" in t for t in severities)
    assert any(s == "high" for s in severities.values())
    assert report.diversification_score < 40


def test_balanced_portfolio_scores_well():
    sectors = ["Banking", "IT", "FMCG", "Pharma", "Auto", "Energy", "Metals", "Telecom"]
    holdings = [h(f"S{i}.NS", 10000, sectors[i % 8]) for i in range(16)]
    report = analyze(holdings, cash=20000)
    assert report.effective_holdings == 16
    assert report.diversification_score >= 85
    assert not any(f.severity in ("high", "medium") for f in report.findings)


def test_cash_only_account():
    report = analyze([], cash=100000)
    assert report.holdings_count == 0
    assert report.diversification_score == 0
    assert report.cash_weight == 1.0
    assert any("cash" in f.title for f in report.findings)


def test_weighted_beta_uses_enrichment_when_coverage_is_sufficient():
    report = analyze([h("A.NS", 50000, "IT"), h("B.NS", 50000, "Banking")], cash=0,
                     enrichment={"A.NS": {"beta": 1.0}, "B.NS": {"beta": 2.0}})
    assert report.weighted_beta == 1.5
    assert any("beta" in f.title for f in report.findings)
