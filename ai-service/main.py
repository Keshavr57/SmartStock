from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="SmartStock AI Advisor", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not found!")
else:
    print(f"✅ GROQ_API_KEY loaded: {GROQ_API_KEY[:10]}...")

groq_client = Groq(api_key=GROQ_API_KEY)

# System prompt for financial advisor
SYSTEM_PROMPT = """You are an expert Indian stock market financial advisor specializing in NSE and BSE markets.

RULES:
1. ONLY answer questions about: stocks, trading, investing, IPOs, mutual funds, market analysis, financial planning
2. If question is NOT financial, respond: "I can only help with financial and investment questions. Please ask about stocks, trading, or market analysis."
3. Keep responses under 200 words
4. Use simple, clear language
5. Focus on Indian markets (NSE, BSE, Indian companies)
6. Use ₹ for currency
7. Always add disclaimer: "This is educational advice. Do your own research."

EXPERTISE:
- Stock analysis (P/E, P/B, ROE, fundamentals)
- Indian stock recommendations (Reliance, TCS, HDFC, etc.)
- SIP and investment strategies
- Risk management
- IPO analysis
- Market trends

Be friendly, helpful, and educational. Give actionable advice with clear reasoning."""

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "user"

@app.get("/")
async def root():
    return {
        "service": "SmartStock AI Advisor",
        "status": "running",
        "version": "2.0.0"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "groq_configured": bool(GROQ_API_KEY)
    }

@app.post("/process")
async def process_query(request: ChatRequest):
    """Process AI query - financial questions only"""
    try:
        if not GROQ_API_KEY:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        if not request.message or len(request.message.strip()) == 0:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        print(f"💬 Query from {request.user_id}: {request.message[:50]}...")
        
        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.message}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=400,
            top_p=1,
            stream=False
        )
        
        # Extract response
        ai_response = chat_completion.choices[0].message.content
        
        if not ai_response or len(ai_response.strip()) == 0:
            raise Exception("AI returned empty response")
        
        print(f"✅ Response generated: {len(ai_response)} chars")
        
        return {
            "status": "success",
            "answer": ai_response.strip()
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    print(f"🚀 Starting AI Advisor on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
