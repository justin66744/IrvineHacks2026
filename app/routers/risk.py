import random

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.census import geocode_location
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


class MapMarker(BaseModel):
    id: str
    kind: str
    label: str
    lat: float
    lng: float
    title: str
    detail: str
    date: str


class MapCluster(BaseModel):
    id: str
    lat: float
    lng: float
    count: int
    title: str
    detail: str
    top_buyer: str


class MapResponse(BaseModel):
    location: str
    center: dict
    zoom: int
    breakdown: dict
    buyers: list[dict]
    trend: dict
    markers: list[MapMarker]
    clusters: list[MapCluster]


def _offset(lat: float, lng: float, dx: float, dy: float) -> tuple[float, float]:
    return lat + dy, lng + dx


def _build_map_payload(location: str, month: int) -> MapResponse:
    geo = geocode_location(location) or {
        "matched_address": location,
        "latitude": 33.6846,
        "longitude": -117.8265,
    }
    risk = compute_risk(address=location)
    score = int(risk["score"])

    llc_pct = min(90, max(20, score * 7 + (risk.get("related_entities") or 0)))
    cash_pct = min(88, llc_pct - 6) if risk.get("all_cash") else min(78, max(18, score * 5 + 8))
    repeat_pct = min(92, max(24, score * 8 + (risk.get("properties_owned") or 0)))

    lat = float(geo["latitude"])
    lng = float(geo["longitude"])
    rng = random.Random(f"{location}:{month}")

    growth = max(0.45, min(1.2, 0.45 + month * 0.055))
    cluster_a = max(3, round(month / 2 + 1))
    cluster_b = max(2, round(month / 3 + 1))

    owner_points = [
        _offset(lat, lng, -0.0062, 0.0034),
        _offset(lat, lng, -0.0014, -0.0042),
        _offset(lat, lng, 0.0046, 0.0028),
    ]
    llc_points = [
        _offset(lat, lng, 0.0068, 0.0042),
        _offset(lat, lng, 0.0034, -0.0018),
    ]
    cash_points = [
        _offset(lat, lng, 0.0086, -0.0038),
    ]

    markers: list[MapMarker] = []
    for idx, (m_lat, m_lng) in enumerate(owner_points, start=1):
        markers.append(
            MapMarker(
                id=f"owner-{idx}",
                kind="owner",
                label="Owner-Occupied",
                lat=m_lat + rng.uniform(-0.0006, 0.0006),
                lng=m_lng + rng.uniform(-0.0006, 0.0006),
                title=f"{12 + idx} Willow Bend",
                detail="Owner-Occupied",
                date="Purchased 2024",
            )
        )

    for idx, (m_lat, m_lng) in enumerate(llc_points, start=1):
        markers.append(
            MapMarker(
                id=f"llc-{idx}",
                kind="llc",
                label="LLC Purchase",
                lat=m_lat + rng.uniform(-0.0006, 0.0006),
                lng=m_lng + rng.uniform(-0.0006, 0.0006),
                title=f"{40 + idx} Maple Terrace",
                detail="LLC Purchase",
                date="Purchased 2026",
            )
        )

    for idx, (m_lat, m_lng) in enumerate(cash_points, start=1):
        markers.append(
            MapMarker(
                id=f"cash-{idx}",
                kind="cash",
                label="All-Cash Purchase",
                lat=m_lat + rng.uniform(-0.0006, 0.0006),
                lng=m_lng + rng.uniform(-0.0006, 0.0006),
                title=f"{60 + idx} Cedar View",
                detail="All-Cash Purchase",
                date="Purchased 2026",
            )
        )

    clusters = [
        MapCluster(
            id="cluster-a",
            lat=lat + 0.0042,
            lng=lng + 0.0074,
            count=cluster_a,
            title="High Investor Concentration",
            detail=f"{cluster_a + 6} LLC purchases in last 90 days",
            top_buyer="Sunset Holdings LLC",
        ),
        MapCluster(
            id="cluster-b",
            lat=lat - 0.0058,
            lng=lng - 0.0062,
            count=cluster_b,
            title="High Investor Concentration",
            detail=f"{cluster_b + 4} LLC purchases in last 90 days",
            top_buyer="Arrow Capital",
        ),
    ]

    investor_series = [18, 22, 28, 34, 42, 50, 58, 66, 72, 78, 84, 92]
    family_series = [52, 54, 56, 58, 60, 61, 62, 63, 64, 66, 67, 68]

    trim = max(1, min(12, month))
    investor_series = investor_series[:trim] + [investor_series[trim - 1]] * (12 - trim)
    family_series = family_series[:trim] + [family_series[trim - 1]] * (12 - trim)

    buyers = [
        {"name": "Sunset Holdings LLC", "count": 18},
        {"name": "Arrow Capital", "count": 12},
        {"name": "Evergreen Trust", "count": 9},
        {"name": "Bright Homes LLC", "count": 7},
    ]

    return MapResponse(
        location=geo["matched_address"],
        center={"lat": lat, "lng": lng},
        zoom=14,
        breakdown={
            "llc": llc_pct,
            "cash": cash_pct,
            "repeat": repeat_pct,
        },
        buyers=buyers,
        trend={
            "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Present"],
            "investor": investor_series,
            "family": family_series,
            "heat_scale": round(growth, 2),
        },
        markers=markers,
        clusters=clusters,
    )


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


@router.get("/map", response_model=MapResponse)
def get_risk_map(
    location: str = Query(...),
    month: int = Query(12, ge=1, le=12),
):
    return _build_map_payload(location=location, month=month)
