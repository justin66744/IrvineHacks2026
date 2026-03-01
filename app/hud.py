import httpx

HUD_BASE = "https://data.hud.gov"
TIMEOUT = 15.0


def fetch_housing_counselors(city: str | None = None, state: str | None = None, limit: int = 50) -> list[dict]:
    params = {"RowLimit": str(min(limit, 100))}
    if city:
        params["City"] = city.strip()
    if state:
        params["State"] = state.strip()[:2].upper()
    try:
        with httpx.Client(timeout=TIMEOUT, follow_redirects=True) as client:
            r = client.get(
                f"{HUD_BASE}/Housing_Counselor/search",
                params=params,
                headers={"Accept": "application/json"},
            )
            r.raise_for_status()
            data = r.json()
    except Exception:
        return []
    raw = data if isinstance(data, list) else data.get("results", data.get("agencies", []))
    if not isinstance(raw, list):
        return []
    out = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        name = item.get("AgencyName") or item.get("agencyName") or item.get("name") or ""
        if not name:
            continue
        out.append({
            "name": name,
            "city": item.get("City") or item.get("city", ""),
            "state": item.get("State") or item.get("state", ""),
            "phone": item.get("Phone") or item.get("phone") or item.get("PhoneNumber", ""),
            "address": item.get("Address") or item.get("address") or "",
            "url": item.get("WebURL") or item.get("url") or item.get("website", ""),
            "services": item.get("Services") or item.get("services"),
        })
    return out
