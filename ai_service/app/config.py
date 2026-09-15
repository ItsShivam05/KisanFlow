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
    
    # Jharkhand Regional Price Prediction & Profit Optimization Paths
    JHARKHAND_RAW_PRICE_PATH: str = str(BASE_DIR / "ai_service" / "data" / "raw" / "jharkhand_price_synthetic.csv")
    JHARKHAND_PROCESSED_PRICE_PATH: str = str(BASE_DIR / "ai_service" / "data" / "processed" / "jharkhand_price_features.csv")
    JHARKHAND_PRICE_MODEL_PATH: str = str(BASE_DIR / "ai_service" / "models" / "jharkhand_price_models.joblib")
    
    # Optimization Defaults
    VEHICLE_CAPACITY_KG: float = 5000.0
    COST_PER_KM: float = 20.0
    FIXED_VEHICLE_COST: float = 1000.0
    ROAD_CIRCUITY_FACTOR: float = 1.28
    
    # Farmer Economic Decision & Consumer Protection Defaults
    DEFAULT_HOLDING_COST_PER_KG_DAY: float = 0.15
    DEFAULT_HANDLING_COST_PER_KG: float = 0.30
    DEFAULT_DAILY_WASTAGE_RATE: float = 0.015  # 1.5% daily spoilage
    DEFAULT_CONSUMER_PRICE_THRESHOLD: float = 45.0  # INR/kg trigger for affordability alerts
    DEFAULT_MAX_MARKET_SHARE: float = 0.50  # Max single market share in multi-allocation
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

