from fastapi import APIRouter, HTTPException
from models.chat_models import ChatRequest, ChatResponse
from services.groq_service import get_ai_response


router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")

    try:
        reply = await get_ai_response(request)
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    return {"status": "FinSage AI service is running", "model": "llama-3.3-70b-versatile"}
