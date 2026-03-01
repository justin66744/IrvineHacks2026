from fastapi import APIRouter, Query

from app.hud import fetch_housing_counselors

router = APIRouter(prefix="/assistance", tags=["assistance"])


@router.get("")
def list_assistance(
    city: str | None = Query(None, description="City for HUD housing counselors"),
    state: str | None = Query("CA", description="2-letter state"),
    limit: int = Query(30, ge=1, le=100),
):
    counselors = fetch_housing_counselors(city=city, state=state, limit=limit)
    return {
        "programs": counselors,
        "source": "HUD Housing Counselor API (data.hud.gov)",
    }
