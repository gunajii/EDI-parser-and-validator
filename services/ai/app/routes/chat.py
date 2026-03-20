from fastapi import APIRouter

from app.core.context_builder import build_context
from app.core.llm_client import generate_response
from app.core.prompt_builder import build_prompt
from app.models.chat_models import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    context = build_context(
        payload.transaction_type or "unknown",
        payload.segment,
        payload.error,
        payload.value,
    )
    prompt = build_prompt(payload.question or "How do I fix this?", context)
    response = generate_response(prompt, context)
    return ChatResponse(**response)
