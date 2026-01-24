from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    openai_api_key: str = ""
    tower_chat_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    confidence_threshold: float = 0.6
    escalation_email_from: str = "concierge@checkmate.ai"

    class Config:
        env_file = ".env"


settings = Settings()
