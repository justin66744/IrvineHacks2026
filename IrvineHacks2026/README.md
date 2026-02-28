# First-Mover Alert

Reduce reaction time for local buyers. Transparency in institutional real estate activity.

## Run

Backend: uvicorn app.main:app --reload
Frontend: cd frontend && npm install && npm run dev

API: http://127.0.0.1:8000  App: http://localhost:5173

## APIs to add later

RentCast (property), OpenAI (risk), Twilio/Resend (alerts), Postgres/Supabase (DB).
Copy .env.example to .env when you add keys.
