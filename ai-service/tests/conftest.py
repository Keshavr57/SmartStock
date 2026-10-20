import os

# Tests never touch real services.
os.environ.setdefault("JWT_SECRET", "test-secret-that-is-long-enough-for-hs256")
os.environ.setdefault("GROQ_API_KEY", "test")
os.environ.setdefault("MONGO_URI", "mongodb://localhost:1")
