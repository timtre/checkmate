from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    openai_api_key: str = ""
    chat_model: str = "gpt-5.1"
    confidence_threshold: float = 0.6
    escalation_email_from: str = "concierge@checkmate.ai"
    tower_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
