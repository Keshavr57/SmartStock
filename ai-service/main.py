import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat_router import router


app = FastAPI(
    title="FinSage AI Service",
    description="SmartStock AI Financial Advisor — powered by Groq + LLaMA",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5050",
        "https://smart-stock-ku3d.vercel.app",
        "https://smartstock-ai-service.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "FinSage AI Service is live", "docs": "/docs"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
