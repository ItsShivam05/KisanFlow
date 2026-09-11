from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    
    # Gemini API Key (Optional prototype market intelligence)
    GEMINI_API_KEY: Optional[str] = None
    
    # Storage & Model Paths
    MODEL_PATH: str = str(BASE_DIR / "ai_service" / "models" / "demand_model.joblib")
    RAW_DATA_PATH: str = str(BASE_DIR / "ai_service" / "data" / "raw" / "demand_raw.csv")
    PROCESSED_DATA_PATH: str = str(BASE_DIR / "ai_service" / "data" / "processed" / "demand_processed.csv")
    SEEDS_DIR: str = str(BASE_DIR / "ai_service" / "data" / "seeds")
    
    # Optimization Defaults
    VEHICLE_CAPACITY_KG: float = 5000.0
    COST_PER_KM: float = 20.0
    FIXED_VEHICLE_COST: float = 1000.0
    ROAD_CIRCUITY_FACTOR: float = 1.28
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
