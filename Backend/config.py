import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""
    MONGO_URI = os.environ.get(
        "MONGO_URI",
        "mongodb://localhost:27017/pulseboard"
    )
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY",
        "dev-fallback-secret-change-in-production"
    )
    JWT_EXPIRATION_HOURS = 72
    PORT = int(os.environ.get("PORT", 5000))
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
