from fastapi import APIRouter
from pydantic import BaseModel

from app.explain import generate_risk_explanation
from app.risk_engine import compute_risk

router = APIRouter(prefix="/risk", tags=["risk"])


class RiskRequest(BaseModel):
    address: str | None = None
    zip_code: str | None = None
    raw: str | None = None


class RiskResponse(BaseModel):
    score: int
    label: str
    signals: list[str]
    explanation: str
    properties_owned: int | None = None
    all_cash: bool | None = None
    related_entities: int | None = None


@router.post("/score", response_model=RiskResponse)
def get_risk_score(req: RiskRequest):
    address = req.address or req.raw
    result = compute_risk(address=address, zip_code=req.zip_code)
    location = result.get("resolved_zip") or (address if address else req.zip_code)
    explanation = generate_risk_explanation(
        signals=result["signals"],
        score=result["score"],
        label=result["label"],
        fallback=result["explanation"],
        location=location,
    )
    return RiskResponse(
        score=result["score"],
        label=result["label"],
        signals=result["signals"],
        explanation=explanation,
        properties_owned=result.get("properties_owned"),
        all_cash=result.get("all_cash"),
        related_entities=result.get("related_entities"),
    )
