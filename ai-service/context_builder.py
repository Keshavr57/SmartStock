def build_context(question, data):
    return f"""
Question: {question}

Known Financial Knowledge:
{data}

Rules:
- Explain simply
- Use examples
- Do not give buy/sell advice
"""
