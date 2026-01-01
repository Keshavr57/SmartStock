from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import os

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

@app.post("/process")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"🤖 AI Service received query: {request.message}")
        print(f"🤖 User ID: {request.user_id}")
        
        # BYPASS LOGIC: If the system asks for raw IPO data, return it directly
        if request.message == "FETCH_LIVE_IPOS_NOW":
            raw_data = get_current_ipos()
            return {"status": "success", "answer": raw_data}
        
        if request.message == "FETCH_STOCKS_JSON":
            raw_data = get_ui_landing_stocks()
            return {"status": "success", "answer": raw_data}
        
        # Otherwise, let the AI Agent handle the chat normally
        print("🤖 Processing query with AI engine...")
        ai_answer = process_query(request.message)
        print(f"🤖 AI Response generated: {ai_answer[:100]}...")
        
        return {"status": "success", "answer": ai_answer}
        
    except Exception as e:
        print(f"🚨 AI Service Error: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Render provides PORT environment variable
    port = int(os.getenv("PORT", 10000))
    host = "0.0.0.0"  # Must bind to 0.0.0.0 for Render
    
    print(f"Starting AI service on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")