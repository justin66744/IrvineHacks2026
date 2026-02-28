"""Assistance match — DPA, first-time buyer programs. Stub for first commit."""
from fastapi import APIRouter

router = APIRouter(prefix="/assistance", tags=["assistance"])


@router.get("")
def list_assistance():
    """Stub: would return local down-payment / first-time buyer programs. Use static JSON or HUD data later."""
    return {
        "programs": [],
        "message": "Assistance match not yet implemented. Add static JSON or HUD dataset.",
    }
