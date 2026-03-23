from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    APP_NAME: str = "VideoMachine"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite:///./videomachine.db"
    REDIS_URL: str = "redis://localhost:6379"

    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    ELEVEN_LABS_API_KEY: Optional[str] = None

    PEXELS_API_KEY: Optional[str] = None
    PIXABAY_API_KEY: Optional[str] = None

    STORAGE_TYPE: str = "local"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "videomachine-uploads"
    S3_REGION: str = "us-east-1"

    FEDAPAY_PUBLIC_KEY: Optional[str] = None
    FEDAPAY_SECRET_KEY: Optional[str] = None
    FEDAPAY_ENV: str = "sandbox"

    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 104857600

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
