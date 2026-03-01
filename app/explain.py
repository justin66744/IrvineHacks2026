from app.config import OPENAI_API_KEY


def generate_risk_explanation(
    signals: list[str],
    score: int,
    label: str,
    fallback: str,
    location: str | None = None,
) -> str:
    if not OPENAI_API_KEY or not signals:
        return fallback
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        loc = f" for this location (ZIP/area: {location})" if location else " for this area"
        prompt = (
            "You are a real estate transparency assistant. In one or two short sentences, "
            f"explain to a family homebuyer why{loc} there is the following corporate acquisition risk: "
            f"score {score}/10, {label}. Be clear and helpful. Do not use bullet points. "
            "Write as if speaking directly about this specific location.\n\n"
            "Signals: " + "; ".join(signals)
        )
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
        )
        if r.choices and r.choices[0].message.content:
            return r.choices[0].message.content.strip()
    except Exception:
        pass
    return fallback
