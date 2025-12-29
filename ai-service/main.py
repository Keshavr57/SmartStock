from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional


from fastapi.middleware.cors import CORSMiddleware

from engine import process_query
from ipo_service import get_current_ipos
from engine import get_ui_landing_stocks

app = FastAPI()

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

@app.post("/process")
async def chat_endpoint(request: ChatRequest):
    try:
        # BYPASS LOGIC: If the system asks for raw IPO data, return it directly
        if request.message == "FETCH_LIVE_IPOS_NOW":
            raw_data = get_current_ipos()
            return {"status": "success", "answer": raw_data}
        
        if request.message == "FETCH_STOCKS_JSON":
            raw_data = get_ui_landing_stocks()
            return {"status": "success", "answer": raw_data}
        
        # Otherwise, let the AI Agent handle the chat normally
        ai_answer = process_query(request.message)
        return {"status": "success", "answer": ai_answer}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)