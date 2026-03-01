import json
import time

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import DATA_DIR
from app.census import fetch_acs5_for_zcta
from app.risk_engine import compute_risk
from app.explain import generate_risk_explanation

router = APIRouter(prefix="/listings", tags=["listings"])

DEFAULT_ZCTAS = ["92618", "92626", "92701", "92606", "92801", "92660"]
INGESTED_PATH = DATA_DIR / "ingested_listings.json"

ZIP_CENTERS = {
    "92618": [33.64, -117.79],
    "92626": [33.64, -117.91],
    "92701": [33.74, -117.87],
    "92606": [33.69, -117.83],
    "92801": [33.83, -117.96],
    "92660": [33.62, -117.93],
}


def _zctas_from_rules() -> list[str]:
    path = DATA_DIR / "risk_rules.json"
    if not path.exists():
        return DEFAULT_ZCTAS
    try:
        with open(path) as f:
            data = json.load(f)
        zips = [k for k in data if k != "default" and k.isdigit()]
        return zips if zips else DEFAULT_ZCTAS
    except Exception:
        return DEFAULT_ZCTAS


def _load_ingested() -> list[dict]:
    if not INGESTED_PATH.exists():
        return []
    try:
        with open(INGESTED_PATH) as f:
            data = json.load(f)
        return data.get("listings", [])
    except Exception:
        return []


def _save_ingested(listings: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(INGESTED_PATH, "w") as f:
        json.dump({"listings": listings}, f, indent=2)


def _area_to_listing(area: dict, risk: dict) -> dict:
    zcta = area["zcta"]
    coords = ZIP_CENTERS.get(zcta)
    out = {
        "id": zcta,
        "address": area.get("name") or f"ZIP {zcta}",
        "price": area.get("median_home_value"),
        "population": area.get("population"),
        "owner_occupied_units": area.get("owner_occupied_units"),
        "renter_occupied_units": area.get("renter_occupied_units"),
        "source": "Census ACS 5-Year",
        "risk": {
            "score": risk["score"],
            "label": risk["label"],
            "signals": risk["signals"],
            "explanation": risk["explanation"],
        },
    }
    if coords:
        out["lat"], out["lng"] = coords
    return out


def _ingested_to_listing(row: dict) -> dict:
    risk = compute_risk(address=row.get("address"))
    return {
        "id": row["id"],
        "address": row.get("address", ""),
        "price": row.get("price"),
        "source": row.get("source", "ingested"),
        "risk": {
            "score": risk["score"],
            "label": risk["label"],
            "signals": risk["signals"],
            "explanation": risk["explanation"],
        },
    }


@router.get("")
def list_listings(
    zip_code: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    try:
        ingested = [_ingested_to_listing(r) for r in _load_ingested()]
    except Exception:
        ingested = []
    zctas = [zip_code] if zip_code else _zctas_from_rules()
    zctas = zctas[: max(0, limit - len(ingested))]
    for z in zctas:
        try:
            area = fetch_acs5_for_zcta(z)
            if not area:
                continue
            risk = compute_risk(zip_code=z)
            ingested.append(_area_to_listing(area, risk))
        except Exception:
            continue
    return {"listings": ingested[:limit], "source": "U.S. Census Bureau ACS 5-Year (2022) + ingested"}


@router.get("/{listing_id}")
def get_listing(listing_id: str):
    if listing_id.startswith("ingested-"):
        for row in _load_ingested():
            if row.get("id") == listing_id:
                risk = compute_risk(address=row.get("address"))
                explanation = generate_risk_explanation(
                    signals=risk["signals"],
                    score=risk["score"],
                    label=risk["label"],
                    fallback=risk["explanation"],
                    location=risk.get("resolved_zip") or row.get("address"),
                )
                out = _ingested_to_listing(row)
                out["risk"]["explanation"] = explanation
                out["risk"]["properties_owned"] = risk.get("properties_owned")
                out["risk"]["all_cash"] = risk.get("all_cash")
                out["risk"]["related_entities"] = risk.get("related_entities")
                return out
        raise HTTPException(status_code=404, detail="Ingested listing not found")
    area = fetch_acs5_for_zcta(listing_id)
    if not area:
        raise HTTPException(status_code=404, detail="ZIP not found or no Census data")
    risk = compute_risk(zip_code=listing_id)
    explanation = generate_risk_explanation(
        signals=risk["signals"],
        score=risk["score"],
        label=risk["label"],
        fallback=risk["explanation"],
        location=listing_id,
    )
    listing = _area_to_listing(area, risk)
    listing["risk"]["explanation"] = explanation
    listing["risk"]["properties_owned"] = risk.get("properties_owned")
    listing["risk"]["all_cash"] = risk.get("all_cash")
    listing["risk"]["related_entities"] = risk.get("related_entities")
    return listing


class ListingIn(BaseModel):
    address: str
    price: int | None = None
    source: str | None = None


@router.post("/ingest")
def ingest_listing(listing: ListingIn):
    listings = _load_ingested()
    lid = f"ingested-{int(time.time() * 1000)}"
    listings.append({
        "id": lid,
        "address": listing.address.strip(),
        "price": listing.price,
        "source": (listing.source or "ingested").strip() or "ingested",
    })
    _save_ingested(listings)
    return {"ok": True, "id": lid, "address": listing.address}
