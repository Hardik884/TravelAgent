from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Keys
    google_ai_api_key: str
    rapidapi_key: str = None 
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # CORS settings
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
