from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.alert_service import subscribe

router = APIRouter(prefix="/alerts", tags=["alerts"])


class SubscribeRequest(BaseModel):
    email: str | None = None
    phone: str | None = None
    zip_code: str | None = None


@router.post("/subscribe")
def subscribe_alerts(req: SubscribeRequest):
    ok, message = subscribe(email=req.email, phone=req.phone, zip_code=req.zip_code)
    if not ok:
        raise HTTPException(status_code=400, detail=message)
    return {"ok": True, "message": message, "email": req.email, "phone": req.phone, "zip_code": req.zip_code}
