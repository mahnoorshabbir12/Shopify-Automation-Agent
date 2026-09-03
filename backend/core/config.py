from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Shopify Automation Agent"
    
    # PostgreSQL Configuration
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    # Shopify Configuration
    SHOPIFY_WEBHOOK_SECRET: str
    SHOPIFY_STORE_URL: str
    SHOPIFY_CLIENT_ID: str
    SHOPIFY_CLIENT_SECRET: str
    
    # Retell AI Configuration
    RETELL_API_KEY: str = "mock-key-for-tests"
    RETELL_AGENT_ID: str = "mock-agent-for-tests"
    PLIVO_PHONE_NUMBER: str = "+1234567890"


    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
