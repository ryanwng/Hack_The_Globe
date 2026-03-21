from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.sessions import router as sessions_router
from app.routes.voice import router as voice_router

app = FastAPI(
    title="Testing API",
    version="1.0.0",
    description="Test.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router, prefix="/v1", tags=["sessions"])
app.include_router(voice_router, prefix="/v1/voice", tags=["voice"])


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}