def route_question(q: str):
    q = q.lower()

    # Concept questions
    if q.startswith("what is") or q.startswith("define"):
        return "CONCEPT"

    # Indicator based
    indicators = ["rsi", "macd", "moving average", "42 week"]
    if any(i in q for i in indicators):
        return "INDICATOR"

    # Fundamental based
    fundamentals = ["pe", "roe", "debt", "eps"]
    if any(f in q for f in fundamentals):
        return "FUNDAMENTAL"

    # IPO
    if "ipo" in q:
        return "IPO"

    return "GENERAL_FINANCE"
