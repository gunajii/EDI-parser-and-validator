from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.validate import router as validate_router

app = FastAPI(title="EDI Validator Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(validate_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "validator"}
