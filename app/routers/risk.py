"""Corporate Acquisition Risk Score — stub for first commit."""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/risk", tags=["risk"])


class RiskRequest(BaseModel):
    listing_id: str | None = None
    address: str | None = None
    raw: str | None = None


class RiskResponse(BaseModel):
    score: int  # 0-10
    label: str
    signals: list[str]
    explanation: str
    properties_owned: int | None = None
    all_cash: bool | None = None
    related_entities: int | None = None


@router.post("/score", response_model=RiskResponse)
def get_risk_score(req: RiskRequest):
    """Stub: returns mock risk score. Replace with real entity/cash/concentration logic + OpenAI explanation."""
    return RiskResponse(
        score=6,
        label="Moderate corporate acquisition risk",
        signals=["Repeat buyer in ZIP", "All-cash common in area", "Entity ownership nearby"],
        explanation="This area shows elevated institutional activity. Local buyers may want early alerts for new listings.",
        properties_owned=20,
        all_cash=True,
        related_entities=6,
    )
