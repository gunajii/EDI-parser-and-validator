from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router as chat_router
from app.routes.translate import router as translate_router

app = FastAPI(title="EDI AI Assistant Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(translate_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ai"}
