"""First-Mover Alert API — corporate acquisition risk, alerts, transparency."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import alerts, assistance, health, listings, risk

app = FastAPI(
    title="First-Mover Alert API",
    description="Reduce reaction time for local buyers. Transparency in institutional real estate activity.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(listings.router)
app.include_router(risk.router)
app.include_router(alerts.router)
app.include_router(assistance.router)
