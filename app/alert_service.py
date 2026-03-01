import json
import re

import httpx

from app.config import DATA_DIR, RESEND_API_KEY

SUBSCRIBERS_PATH = DATA_DIR / "alert_subscribers.json"
FREETXT_API = "https://freetxtapi.com"
SMS_TIMEOUT = 30.0


def _normalize_phone(raw: str) -> str | None:
    digits = re.sub(r"\D", "", (raw or "").strip())
    if len(digits) == 10:
        return digits
    if len(digits) == 11 and digits.startswith("1"):
        return digits[1:]
    return None


def _send_sms_freetxt(phone_10: str, body: str) -> tuple[bool, str]:
    last_err = ""
    for attempt in range(2):
        try:
            with httpx.Client(timeout=SMS_TIMEOUT) as client:
                r = client.post(
                    FREETXT_API,
                    data={"phone": phone_10, "message": body},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                try:
                    data = r.json() if r.content else {}
                except Exception:
                    data = {}
                status = (data.get("status") or "").upper()
                if status == "DELIVERED":
                    return True, "SMS sent"
                if status == "WAITING OPT-IN":
                    return False, "Recipient must opt in first (FreeTxtAPI)"
                if status == "LIMIT REACHED":
                    return False, "SMS rate limit reached (FreeTxtAPI)"
                last_err = data.get("status") or (r.text or f"HTTP {r.status_code}")
                break
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            last_err = str(e)
            if attempt == 0:
                import time
                time.sleep(1)
            else:
                return False, last_err
        except Exception as e:
            return False, str(e)
    return False, last_err or "SMS failed"


def _send_email(to: str, subject: str, html: str) -> tuple[bool, str]:
    if not RESEND_API_KEY:
        return False, "Resend not configured"
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": "First-Mover Alert <onboarding@resend.dev>",
            "to": [to],
            "subject": subject,
            "html": html,
        })
        return True, "Email sent"
    except Exception as e:
        return False, str(e)


def _save_subscriber(
    email: str | None,
    phone: str | None,
    zip_code: str | None,
) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    entries = []
    if SUBSCRIBERS_PATH.exists():
        try:
            with open(SUBSCRIBERS_PATH) as f:
                data = json.load(f)
            entries = data.get("subscribers", [])
        except Exception:
            pass
    entries.append({
        "email": (email or "").strip() or None,
        "phone": phone,
        "zip_code": (zip_code or "").strip() or None,
    })
    with open(SUBSCRIBERS_PATH, "w") as f:
        json.dump({"subscribers": entries}, f, indent=2)


def subscribe(
    email: str | None = None,
    phone: str | None = None,
    zip_code: str | None = None,
) -> tuple[bool, str]:
    email_clean = (email or "").strip()
    phone_10 = _normalize_phone(phone) if phone else None
    if not email_clean and not phone_10:
        return False, "Provide at least one of email or phone"
    if phone and not phone_10:
        return False, "Invalid phone number (use 10-digit US)"
    _save_subscriber(email_clean or None, phone_10, zip_code)
    zip_part = f" for ZIP {zip_code}" if zip_code else ""
    msg_body = f"You're signed up for First-Mover Alert{zip_part}. We'll notify you when high corporate-risk listings match your area."
    sms_ok, sms_err = False, ""
    if phone_10:
        sms_ok, sms_err = _send_sms_freetxt(phone_10, msg_body)
    email_ok, email_err = False, ""
    if email_clean:
        subject = "You're signed up for First-Mover Alert"
        html = f"<p>You're signed up for First-Mover Alert{zip_part}.</p><p>We'll notify you when high corporate-risk listings match your area.</p>"
        email_ok, email_err = _send_email(email_clean, subject, html)
    if sms_ok or email_ok:
        parts = []
        if sms_ok:
            parts.append("SMS")
        if email_ok:
            parts.append("email")
        return True, f"Subscription confirmed via {' + '.join(parts)}."
    if phone_10 and not sms_ok:
        return True, "You're subscribed. Confirmation SMS didn't go through (free service may be slow); we'll still alert you when we have listings."
    if email_clean and not email_ok:
        if not RESEND_API_KEY:
            return True, "You're subscribed. Add RESEND_API_KEY in .env for confirmation emails."
        return False, f"Email: {email_err}"
    return True, "Subscription saved."
