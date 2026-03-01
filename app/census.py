import httpx

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
