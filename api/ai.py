from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Add the ai-service directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai-service'))

from engine import process_query
from ipo_service import get_current_ipos
from engine import get_ui_landing_stocks

app = FastAPI(title="SmartStock AI Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://smartstock-frontend.vercel.app",  # Add your Vercel frontend URL
        "*"  # For development - remove in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default_user"

class StockRequest(BaseModel):
    symbol: str

@app.get("/")
async def root():
    return {"message": "SmartStock AI Service is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "AI Service"}

@app.post("/process")
async def process_ai_query(request: QueryRequest):
    try:
        response = process_query(request.message, request.user_id)
        return {
            "success": True,
            "response": response,
            "user_id": request.user_id
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response": "I apologize, but I'm experiencing technical difficulties. Please try again later."
        }

@app.get("/ipos")
async def get_ipos():
    try:
        ipos = get_current_ipos()
        return {
            "success": True,
            "data": ipos
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@app.get("/landing-stocks")
async def get_landing_stocks():
    try:
        stocks = get_ui_landing_stocks()
        return {
            "success": True,
            "data": stocks
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

# Export for Vercel
handler = app