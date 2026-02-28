"""Alert subscription — SMS/email. Stub for first commit."""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/alerts", tags=["alerts"])


class SubscribeRequest(BaseModel):
    email: str | None = None
    phone: str | None = None
    zip_code: str | None = None
    listing_id: str | None = None


@router.post("/subscribe")
def subscribe(req: SubscribeRequest):
    """Stub: would send via Twilio (SMS) or Resend/Brevo (email). Not implemented."""
    return {
        "ok": True,
        "message": "Alert signup not yet implemented. Wire Twilio/Resend here.",
        "email": req.email,
        "phone": req.phone,
        "zip_code": req.zip_code,
    }
