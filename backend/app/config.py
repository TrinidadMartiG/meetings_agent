"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Centralised settings loaded from environment variables or .env file.

    All fields can be overridden via environment variables with the same name
    (case-insensitive).
    """

    database_url: str = "postgresql://user:pass@localhost:5432/meetings_db"
    gemini_api_key: str = ""
    google_client_id: str = ""
    jwt_secret: str = "dev-secret-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"


settings = Settings()
