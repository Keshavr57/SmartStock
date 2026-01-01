#!/usr/bin/env python3
import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))
    print(f"Starting server on 0.0.0.0:{port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )