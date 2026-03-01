import json
from fastapi import APIRouter
from app.config import DATA_DIR

router = APIRouter(prefix="/metrics", tags=["metrics"])

SUBSCRIBERS_PATH = DATA_DIR / "alert_subscribers.json"
RISK_RULES_PATH = DATA_DIR / "risk_rules.json"
INGESTED_PATH = DATA_DIR / "ingested_listings.json"


@router.get("")
def get_metrics():
    subscribers = 0
    if SUBSCRIBERS_PATH.exists():
        try:
            with open(SUBSCRIBERS_PATH) as f:
                data = json.load(f)
            subscribers = len(data.get("subscribers", []))
        except Exception:
            pass
    zctas_covered = 0
    if RISK_RULES_PATH.exists():
        try:
            with open(RISK_RULES_PATH) as f:
                data = json.load(f)
            zctas_covered = len([k for k in data if k != "default" and k.isdigit()])
        except Exception:
            pass
    ingested_count = 0
    if INGESTED_PATH.exists():
        try:
            with open(INGESTED_PATH) as f:
                data = json.load(f)
            ingested_count = len(data.get("listings", []))
        except Exception:
            pass
    return {
        "alert_subscribers": subscribers,
        "zctas_covered": zctas_covered,
        "ingested_listings": ingested_count,
    }
