"""App config — use env vars for API keys and DB in production."""
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"

# Optional: set in .env for real integrations
API_BASE_URL = os.environ.get("API_BASE_URL", "http://127.0.0.1:8000")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")  # for risk explanation
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE = os.environ.get("TWILIO_PHONE", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")  # e.g. Supabase / Postgres
