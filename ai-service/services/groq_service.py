import httpx
from config.settings import GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, MAX_TOKENS, TEMPERATURE
from prompts.system_prompt import FINSAGE_SYSTEM_PROMPT
from models.chat_models import ChatRequest


async def get_ai_response(request: ChatRequest) -> str:
    user_name = request.userContext.name if request.userContext else "User"
    user_portfolio = request.userContext.portfolio if request.userContext else 100000

    system_with_context = f"""{FINSAGE_SYSTEM_PROMPT}

CURRENT USER SESSION:
- User's name: {user_name}
- Virtual portfolio balance: ₹{user_portfolio:,}
- If user asks their own name, tell them: {user_name}
- If user asks your name, say: Main FinSage hun — SmartStock ka AI financial advisor!"""

    messages_payload = [
        {"role": "system", "content": system_with_context},
        *[{"role": msg.role, "content": msg.content} for msg in request.messages]
    ]

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    body = {
        "model": GROQ_MODEL,
        "messages": messages_payload,
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(GROQ_API_URL, json=body, headers=headers)

    if response.status_code == 429:
        return "Thoda rush hai abhi — ek second ruko aur dobara try karo! 🙏"

    if response.status_code != 200:
        raise Exception(f"Groq API error: {response.status_code} — {response.text}")

    data = response.json()
    return data["choices"][0]["message"]["content"]
