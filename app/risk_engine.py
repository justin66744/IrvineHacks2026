import json
import re
from typing import Any

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


def compute_risk(
    address: str | None = None,
    zip_code: str | None = None,
) -> dict[str, Any]:
    rules = _load_rules()
    resolved_zip = zip_code or (address and _extract_zip(address))
    if resolved_zip and resolved_zip in rules:
        profile = rules[resolved_zip]
    elif resolved_zip:
        profile = _profile_for_unknown_zip(resolved_zip)
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
