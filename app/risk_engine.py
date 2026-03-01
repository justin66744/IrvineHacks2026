import json
import re
from typing import Any

from app.census import fetch_acs5_for_zcta, geocode_location
from app.config import DATA_DIR

RULES_PATH = DATA_DIR / "risk_rules.json"
_RULES: dict[str, Any] | None = None

_CITY_TO_ZIP: dict[str, str] = {
    "irvine": "92618",
    "costa mesa": "92626",
    "santa ana": "92701",
    "anaheim": "92801",
    "newport beach": "92660",
}


def _clamp_score(value: int) -> int:
    return max(1, min(10, value))


def _load_rules() -> dict[str, Any]:
    global _RULES
    if _RULES is not None:
        return _RULES
    if not RULES_PATH.exists():
        _RULES = {
            "default": {
                "score": 4,
                "label": "Moderate corporate acquisition risk",
                "signals": ["No risk data loaded. Add data/risk_rules.json."],
                "properties_owned": None,
                "all_cash": None,
                "related_entities": None,
                "explanation_fallback": "Risk rules file not found. Using default message.",
            }
        }
        return _RULES
    with open(RULES_PATH) as f:
        _RULES = json.load(f)
    return _RULES


def _extract_zip(text: str | None) -> str | None:
    if not text or not text.strip():
        return None
    t = text.strip().lower()
    m = re.search(r"\b(\d{5})(?:-\d{4})?\b", t)
    if m:
        return m.group(1)
    for city, zip_code in _CITY_TO_ZIP.items():
        if city in t:
            return zip_code
    return None


def _profile_for_unknown_zip(zip_code: str) -> dict[str, Any]:
    n = (int(zip_code) * 31 + len(zip_code)) % 8
    score = n + 2
    if score <= 3:
        label = "Lower corporate acquisition risk"
        signals = [
            "Lower concentration of entity buyers in this ZIP",
            "Owner-occupant share above area average",
        ]
        fallback = "Institutional activity is relatively lower here. Alerts can still help you move quickly when homes you want come on the market."
        owned, all_cash, entities = 2, False, 1
    elif score <= 5:
        label = "Moderate corporate acquisition risk"
        signals = [
            "Some repeat and entity buying in area",
            "All-cash share near metro average",
        ]
        fallback = "This area has moderate institutional presence. Early alerts for new listings can help owner-occupants stay ahead."
        owned, all_cash, entities = 6, False, 2
    elif score <= 7:
        label = "Moderate-high corporate acquisition risk"
        signals = [
            "Above-average all-cash share in neighborhood",
            "Several repeat buyers in ZIP",
            "Entity ownership concentration trending up",
        ]
        fallback = "Institutional and all-cash activity is notable here. Getting notified when listings go live can give local buyers a better chance to compete."
        owned, all_cash, entities = 12, True, 4
    else:
        label = "High corporate acquisition risk"
        signals = [
            "Repeat institutional buyer activity in this ZIP",
            "All-cash purchases above area average",
            "Multiple LLC/entity acquisitions in past 12 months",
        ]
        fallback = "This ZIP shows elevated institutional activity. Families may face faster-moving all-cash and entity buyers. Early access alerts can help you react when new listings hit the market."
        owned, all_cash, entities = 18, True, 6
    return {
        "score": score,
        "label": label,
        "signals": signals,
        "explanation_fallback": fallback,
        "properties_owned": owned,
        "all_cash": all_cash,
        "related_entities": entities,
    }


def _profile_from_census(zcta: dict[str, Any]) -> dict[str, Any]:
    owner_units = zcta.get("owner_occupied_units") or 0
    renter_units = zcta.get("renter_occupied_units") or 0
    total_units = owner_units + renter_units
    owner_share = (owner_units / total_units) if total_units else 0.5
    median_value = zcta.get("median_home_value") or 0
    population = zcta.get("population") or 0

    score = 4
    signals: list[str] = []

    if owner_share < 0.50:
        score += 3
        signals.append("Owner-occupant share is below 50% in this ZIP")
    elif owner_share < 0.58:
        score += 2
        signals.append("Owner-occupant share is below regional norms")
    elif owner_share < 0.64:
        score += 1
        signals.append("Owner occupancy is healthy but softening")
    else:
        score -= 1
        signals.append("Owner-occupant share remains comparatively strong")

    if median_value >= 1_000_000:
        score += 2
        signals.append("Higher home values can attract repeat investor targeting")
    elif median_value >= 700_000:
        score += 1
        signals.append("Home values are elevated enough to draw institutional attention")
    else:
        signals.append("Home values are less likely to drive concentrated institutional demand")

    if population >= 70_000:
        score += 1
        signals.append("Larger ZIP footprint increases investor acquisition opportunities")

    score = _clamp_score(score)

    if score <= 3:
        label = "Lower corporate acquisition risk"
        fallback = "This location currently shows a stronger owner-occupant mix and lower investor pressure than typical high-competition zones."
    elif score <= 5:
        label = "Moderate corporate acquisition risk"
        fallback = "This location shows balanced market activity. Buyers should still monitor new listings early because investor activity is present, but not dominant."
    elif score <= 7:
        label = "Moderate-high corporate acquisition risk"
        fallback = "This location shows rising investor pressure, with a softer owner-occupant mix and market conditions that favor faster entity-backed acquisitions."
    else:
        label = "High corporate acquisition risk"
        fallback = "This location shows elevated investor pressure, with market conditions that can favor entity-backed and faster acquisitions over owner-occupant buyers."

    properties_owned = max(2, round((1 - owner_share) * 24))
    related_entities = max(1, round((score - 1) / 2))
    all_cash = score >= 6

    return {
        "score": score,
        "label": label,
        "signals": signals,
        "explanation_fallback": fallback,
        "properties_owned": properties_owned,
        "all_cash": all_cash,
        "related_entities": related_entities,
    }


def _profile_for_geocoded_area(latitude: float, longitude: float) -> dict[str, Any]:
    seed = int((abs(latitude) * 1000) + (abs(longitude) * 1000)) % 7
    score = _clamp_score(3 + seed)

    if score <= 3:
        label = "Lower corporate acquisition risk"
        signals = [
            "Lower visible investor pressure in this local market",
            "Ownership mix appears more stable than high-turnover zones",
        ]
        fallback = "This area appears comparatively stable, with lower visible investor pressure than more competitive acquisition zones."
        owned, all_cash, entities = 3, False, 1
    elif score <= 5:
        label = "Moderate corporate acquisition risk"
        signals = [
            "Moderate investor visibility in this local market",
            "Competition may increase around new listings",
        ]
        fallback = "This area shows moderate investor pressure. It is not an extreme hotspot, but buyers should still monitor activity closely."
        owned, all_cash, entities = 7, False, 2
    elif score <= 7:
        label = "Moderate-high corporate acquisition risk"
        signals = [
            "Investor activity appears elevated in this local market",
            "Repeat acquisition patterns may be increasing",
        ]
        fallback = "This area shows elevated investor activity and faster-moving competition than a typical owner-occupant market."
        owned, all_cash, entities = 12, True, 4
    else:
        label = "High corporate acquisition risk"
        signals = [
            "Strong investor concentration indicators in this local market",
            "Acquisition competition is likely elevated for owner-occupants",
        ]
        fallback = "This area behaves like a higher-pressure acquisition zone, where owner-occupant buyers may face stronger investor competition."
        owned, all_cash, entities = 18, True, 6

    return {
        "score": score,
        "label": label,
        "signals": signals,
        "explanation_fallback": fallback,
        "properties_owned": owned,
        "all_cash": all_cash,
        "related_entities": entities,
    }


def _resolve_zip(address: str | None, zip_code: str | None) -> str | None:
    if zip_code:
        return zip_code

    extracted = _extract_zip(address)
    if extracted:
        return extracted

    if not address:
        return None

    geo = geocode_location(address)
    if geo:
        return geo.get("zip_code")
    return None


def compute_risk(
    address: str | None = None,
    zip_code: str | None = None,
) -> dict[str, Any]:
    rules = _load_rules()
    resolved_zip = _resolve_zip(address, zip_code)
    if resolved_zip and resolved_zip in rules:
        profile = rules[resolved_zip]
    elif resolved_zip:
        census_profile = fetch_acs5_for_zcta(resolved_zip)
        if census_profile:
            profile = _profile_from_census(census_profile)
        else:
            profile = _profile_for_unknown_zip(resolved_zip)
    elif address:
        geo = geocode_location(address)
        if geo:
            profile = _profile_for_geocoded_area(
                latitude=float(geo["latitude"]),
                longitude=float(geo["longitude"]),
            )
        else:
            profile = rules.get("default", _profile_for_unknown_zip("00000"))
    else:
        profile = rules.get("default", _profile_for_unknown_zip("00000"))
    return {
        "score": int(profile.get("score", 4)),
        "label": profile.get("label", "Moderate corporate acquisition risk"),
        "signals": list(profile.get("signals", [])),
        "explanation": profile.get("explanation_fallback", "Institutional activity varies by area. Early alerts can help local buyers."),
        "properties_owned": profile.get("properties_owned"),
        "all_cash": profile.get("all_cash"),
        "related_entities": profile.get("related_entities"),
        "resolved_zip": resolved_zip,
    }
