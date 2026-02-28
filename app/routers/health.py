"""Health and info."""
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
            "GET /listings — listing ingestion (stub)",
            "POST /risk/score — corporate acquisition risk score (stub)",
            "POST /alerts/subscribe — alert signup (stub)",
            "GET /assistance — assistance match (stub)",
        ],
    }
