from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Employee OS"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    # Database
    DB_HOST: str = "mysql"
    DB_PORT: int = 3306
    DB_NAME: str = "ai_eos"
    DB_USER: str = "eos_user"
    DB_PASSWORD: str = "eos_password_2024"
    DATABASE_URL: str = "mysql+pymysql://eos_user:eos_password_2024@mysql:3306/ai_eos"

    # AI Provider
    AI_PROVIDER: str = "groq"  # groq or ollama
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.3:70b"

    # Storage
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # Company
    COMPANY_NAME: str = "TechCorp Solutions Pvt. Ltd."
    COMPANY_ADDRESS: str = "123 Tech Park, Bangalore, Karnataka 560001"
    COMPANY_EMAIL: str = "hr@techcorp.com"
    COMPANY_PHONE: str = "+91-80-12345678"
    COMPANY_CIN: str = "U72200KA2010PTC054321"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def salary_slips_dir(self) -> str:
        return os.path.join(self.UPLOAD_DIR, "salary_slips")

    @property
    def documents_dir(self) -> str:
        return os.path.join(self.UPLOAD_DIR, "documents")

    @property
    def policies_dir(self) -> str:
        return os.path.join(self.UPLOAD_DIR, "policies")

    @property
    def logos_dir(self) -> str:
        return os.path.join(self.UPLOAD_DIR, "logos")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
