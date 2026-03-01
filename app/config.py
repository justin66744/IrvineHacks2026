import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")
DATA_DIR = PROJECT_ROOT / "data"

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
