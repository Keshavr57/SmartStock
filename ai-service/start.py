import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))
    print(f"🚀 Starting SmartStock AI Advisor on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
