"""Application settings from environment."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./agentos.db"
    jwt_secret: str = "change-me-to-a-random-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    hermes_api_url: str = ""
    hermes_api_key: str = ""
    environment: str = "development"
    log_level: str = "info"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
