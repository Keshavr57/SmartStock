from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration comes from the environment (or .env in development)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # LLM (Groq, OpenAI-compatible API)
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "openai/gpt-oss-120b"
    llm_fallback_model: str = "openai/gpt-oss-20b"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 1800

    # Auth: the same HS256 secret the SmartStock backend signs user tokens with.
    jwt_secret: str = ""

    # SmartStock backend, called with the user's own token for account and market data.
    backend_url: str = "http://localhost:5050/api"

    # Storage for conversations and long-term memory (its own database on the shared cluster).
    mongo_uri: str = ""
    mongo_db: str = "SmartStockAI"

    # Retrieval
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    knowledge_dir: str = "knowledge"
    cache_dir: str = ".cache"

    # Agent limits
    max_tool_rounds: int = 6
    history_messages: int = 10
    summarize_after_messages: int = 20
    rate_limit_per_minute: int = 12

    allowed_origins: str = "http://localhost:5173,https://smart-stock-ku3d.vercel.app"

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
