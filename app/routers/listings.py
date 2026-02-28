"""Listing ingestion — real or simulated. Stub for first commit."""
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import DATA_DIR

router = APIRouter(prefix="/listings", tags=["listings"])

MOCK_PATH = DATA_DIR / "mock_listings.json"


class ListingIn(BaseModel):
    address: str
    price: int | None = None
    source: str | None = None


@router.get("")
def list_listings():
    """Return mock listings for demo. Replace with RentCast or real feed later."""
    if MOCK_PATH.exists():
        import json
        with open(MOCK_PATH) as f:
            return json.load(f)
    return {"listings": [], "message": "No mock data. Add data/mock_listings.json"}


@router.post("/ingest")
def ingest_listing(listing: ListingIn):
    """Stub: would persist listing and trigger risk check. Not implemented."""
    return {"ok": True, "message": "Ingest not yet implemented", "address": listing.address}
