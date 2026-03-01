import httpx
import re

CENSUS_BASE = "https://api.census.gov/data/2022/acs/acs5"
TIMEOUT = 15.0
VARS = "NAME,B01003_001E,B25077_001E,B25003_002E,B25003_003E"


def fetch_acs5_for_zcta(zcta: str) -> dict | None:
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            r = client.get(
                CENSUS_BASE,
                params={
                    "get": VARS,
                    "for": f"zip code tabulation area:{zcta}",
                },
            )
            r.raise_for_status()
            data = r.json()
    except Exception:
        return None
    if not data or len(data) < 2:
        return None
    headers = data[0]
    row = data[1]
    out = dict(zip(headers, row))
    name = out.get("NAME", "")
    pop = out.get("B01003_001E")
    med_val = out.get("B25077_001E")
    owner = out.get("B25003_002E")
    renter = out.get("B25003_003E")
    try:
        population = int(pop) if pop not in (None, "") else None
    except (TypeError, ValueError):
        population = None
    try:
        median_value = int(med_val) if med_val not in (None, "") else None
    except (TypeError, ValueError):
        median_value = None
    try:
        owner_occupied = int(owner) if owner not in (None, "") else None
    except (TypeError, ValueError):
        owner_occupied = None
    try:
        renter_occupied = int(renter) if renter not in (None, "") else None
    except (TypeError, ValueError):
        renter_occupied = None
    return {
        "zcta": zcta,
        "name": name,
        "population": population,
        "median_home_value": median_value,
        "owner_occupied_units": owner_occupied,
        "renter_occupied_units": renter_occupied,
    }


def _parse_zip(text: str) -> str | None:
    match = re.search(r"\b(\d{5})(?:-\d{4})?\b", text or "")
    return match.group(1) if match else None


def _census_geocode(query: str) -> dict | None:
    geocode_url = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            response = client.get(
                geocode_url,
                params={
                    "address": query.strip(),
                    "benchmark": "Public_AR_Current",
                    "format": "json",
                },
            )
            response.raise_for_status()
            data = response.json()
    except Exception:
        return None

    matches = data.get("result", {}).get("addressMatches", [])
    if not matches:
        return None

    best = matches[0]
    coords = best.get("coordinates", {})
    x = coords.get("x")
    y = coords.get("y")
    if x is None or y is None:
        return None

    address_components = best.get("addressComponents", {})
    zip_code = address_components.get("zip")
    if not zip_code:
        matched_address = best.get("matchedAddress", "")
        zip_code = _parse_zip(matched_address)

    return {
        "query": query,
        "matched_address": best.get("matchedAddress", query),
        "longitude": float(x),
        "latitude": float(y),
        "zip_code": zip_code,
    }


def _nominatim_geocode(query: str) -> dict | None:
    try:
        with httpx.Client(
            timeout=TIMEOUT,
            headers={
                "User-Agent": "EquityGuardian/1.0 (local-demo)"
            },
        ) as client:
            response = client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": query.strip(),
                    "format": "jsonv2",
                    "addressdetails": 1,
                    "limit": 1,
                    "countrycodes": "us",
                },
            )
            response.raise_for_status()
            data = response.json()
    except Exception:
        return None

    if not data:
        return None

    best = data[0]
    address = best.get("address", {})
    zip_code = address.get("postcode") or _parse_zip(best.get("display_name", ""))
    if zip_code and "-" in zip_code:
        zip_code = zip_code.split("-", 1)[0]

    lat = best.get("lat")
    lon = best.get("lon")
    if lat is None or lon is None:
        return None

    return {
        "query": query,
        "matched_address": best.get("display_name", query),
        "longitude": float(lon),
        "latitude": float(lat),
        "zip_code": zip_code,
    }


def geocode_location(query: str) -> dict | None:
    if not query or not query.strip():
        return None

    return _census_geocode(query) or _nominatim_geocode(query)
