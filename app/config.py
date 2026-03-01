import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional local convenience dependency
    def load_dotenv(*_args, **_kwargs):
        return False

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")
DATA_DIR = PROJECT_ROOT / "data"

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
