from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import os
import time

from fastapi.middleware.cors import CORSMiddleware

from engine import process_query
from ipo_service import get_current_ipos
from engine import get_ui_landing_stocks

# Get port from environment (Render sets this automatically)
PORT = int(os.getenv("PORT", 10000))

app = FastAPI(
    title="SmartStock AI Service",
    description="AI-powered stock analysis and advisory service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "learning_section"

@app.get("/")
async def root():
    return {"message": "SmartStock AI Service is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "AI Service"}

@app.get("/test")
async def test_ai():
    """Enhanced test endpoint to verify RAG functionality"""
    try:
        # Test GROQ API key
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return {"status": "error", "message": "GROQ API key not found"}
        
        # Test RAG knowledge retrieval
        from engine import get_relevant_knowledge, get_stock_context
        
        test_query = "What is P/E ratio?"
        knowledge = get_relevant_knowledge(test_query)
        stock_context = get_stock_context("reliance stock analysis")
        
        # Test simple AI query
        from engine import process_query_with_rag
        
        test_response = process_query_with_rag("Hello, test the AI service")
        
        return {
            "status": "success", 
            "groq_key_present": bool(groq_key),
            "groq_key_prefix": groq_key[:10] if groq_key else None,
            "rag_knowledge_items": len(knowledge),
            "stock_context_items": len(stock_context),
            "ai_response_length": len(test_response),
            "ai_response_preview": test_response[:100] + "..." if len(test_response) > 100 else test_response,
            "message": "Enhanced RAG-based AI service test completed successfully"
        }
        
    except Exception as e:
        return {"status": "error", "message": f"AI test failed: {str(e)}", "error_type": type(e).__name__}

@app.post("/process")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"🤖 AI Service received query: {request.message}")
        print(f"🤖 User ID: {request.user_id}")
        
        # Test GROQ API key first
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            raise Exception("GROQ API key not found")
        
        print(f"🤖 GROQ API key present: {groq_key[:10]}...")
        
        # BYPASS LOGIC: If the system asks for raw IPO data, return it directly
        if request.message == "FETCH_LIVE_IPOS_NOW":
            raw_data = get_current_ipos()
            return {"status": "success", "answer": raw_data}
        
        if request.message == "FETCH_STOCKS_JSON":
            raw_data = get_ui_landing_stocks()
            return {"status": "success", "answer": raw_data}
        
        # Test simple response first
        if request.message.lower() == "test":
            return {"status": "success", "answer": "AI service is receiving messages correctly and GROQ API is working!"}
        
        # Process with RAG engine - NO FALLBACK
        print("🤖 Processing query with RAG engine...")
        ai_answer = process_query(request.message)
        print(f"🤖 AI Response generated: {len(ai_answer)} characters")
        
        if not ai_answer or len(ai_answer.strip()) == 0:
            raise Exception("AI service returned empty response")
        
        return {
            "status": "success", 
            "answer": ai_answer,
            "service_type": "rag_enhanced",
            "timestamp": str(int(time.time()))
        }
        
    except Exception as e:
        print(f"🚨 AI Service Error: {str(e)}")
        print(f"🚨 Error type: {type(e).__name__}")
        
        # NO FALLBACK - return error
        return {
            "status": "error", 
            "message": f"AI service failed: {str(e)}",
            "error_type": type(e).__name__
        }

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Render provides PORT environment variable
    port = int(os.getenv("PORT", 10000))
    host = "0.0.0.0"  # Must bind to 0.0.0.0 for Render
    
    print(f"Starting AI service on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")