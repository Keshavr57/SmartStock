from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import get_settings

_client: AsyncIOMotorClient | None = None


def get_db() -> AsyncIOMotorDatabase:
    global _client
    settings = get_settings()
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=8000, tz_aware=True)
    return _client[settings.mongo_db]


async def ensure_indexes() -> None:
    db = get_db()
    await db.conversations.create_index([("user_id", 1), ("updated_at", -1)])
    await db.memories.create_index([("user_id", 1), ("created_at", -1)])
    await db.feedback.create_index([("user_id", 1), ("created_at", -1)])


def close() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
