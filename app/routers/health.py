from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/")
def root():
    return {
        "message": "First-Mover Alert API",
        "description": "Corporate acquisition risk score, early access alerts, assistance match.",
        "docs": "/docs",
        "endpoints": [
            "GET /listings",
            "POST /listings/ingest",
            "GET /listings/{id}",
            "POST /risk/score",
            "POST /alerts/subscribe",
            "GET /assistance",
            "GET /metrics",
        ],
    }
