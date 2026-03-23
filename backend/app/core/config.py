import os
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    APP_NAME: str = "VideoMachine"
    SECRET_KEY: str = "dev-secret-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite:///./videomachine.db"

    # FedaPay
    FEDAPAY_SECRET_KEY: Optional[str] = None
    FEDAPAY_PUBLIC_KEY: Optional[str] = None
    FEDAPAY_ENV: str = "sandbox"

    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()

# Path to the MoneyPrinterV2 config.json (shared, or per-user in future)
MP_CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config.json")
MP_SRC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "src")
