import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "KindMinds API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database (Neon Lakebase Postgres)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./kindminds_dev.db"
    )
    DATABASE_URL_UNPOOLED: str = os.getenv("DATABASE_URL_UNPOOLED", "")
    NEON_BRANCH: str = os.getenv("NEON_BRANCH", "production")

    # Neon Services
    NEON_FUNCTION_HELLO_BASE_URL: str = os.getenv("NEON_FUNCTION_HELLO_BASE_URL", "")
    NEON_AUTH_BASE_URL: str = os.getenv("NEON_AUTH_BASE_URL", "")
    NEON_AUTH_JWKS_URL: str = os.getenv("NEON_AUTH_JWKS_URL", "")
    NEON_REALTIME_URL: str = os.getenv("NEON_REALTIME_URL", "")
    NEON_REALTIME_SECRET: str = os.getenv("NEON_REALTIME_SECRET", "")
    
    # AI (Groq)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GROQ_REASONING_EFFORT: str = os.getenv("GROQ_REASONING_EFFORT", "medium")
    GROQ_MAX_COMPLETION_TOKENS: int = int(os.getenv("GROQ_MAX_COMPLETION_TOKENS", "2048"))
    GROQ_TEMPERATURE: float = float(os.getenv("GROQ_TEMPERATURE", "1.0"))
    
    # Auth & Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "kindminds-humanitarian-platform-secure-jwt-key-2026")
    JWT_ALGORITHM: str = "HS256"
    JOURNAL_ENCRYPTION_KEY: str = os.getenv("JOURNAL_ENCRYPTION_KEY", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:4321",
        "http://localhost:3000",
        "http://127.0.0.1:4321",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()

