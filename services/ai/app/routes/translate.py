from __future__ import annotations

from collections import defaultdict
import os
from typing import Any, Dict, List

from fastapi import APIRouter

from app.core.prompt_builder import build_translation_prompt
from app.core.ollama_client import generate_json_response_ollama
from app.core.training_data import save_translation_training_example
from app.models.translation_models import TranslateRequest, TranslateResponse

router = APIRouter(prefix="/translate", tags=["translate"])


def _reconstruct_segment(seg: Dict[str, Any], max_elements: int = 12) -> str:
    seg_id = str(seg.get("id") or "")
    elements = seg.get("elements") or []
    if not isinstance(elements, list):
        elements = [str(elements)]
    trimmed = [str(x) for x in elements[:max_elements]]
    return f"{seg_id}*" + "*".join(trimmed)


def _build_excerpt(segments: List[Dict[str, Any]], max_lines: int = 120) -> str:
    header_ids = {"ISA", "GS", "ST", "BHT", "BGN", "SE", "GE", "IEA"}
    interest_ids = {
        "NM1",
        "CLM",
        "DTP",
        "SV1",
        "SV2",
        "HL",
        "INS",
        "REF",
        "HD",
        "LX",
        "CLP",
        "BPR",
        "TRN",
        "SVC",
        "CAS",
        "PLB",
        "SVC",
    }

    seen: Dict[str, int] = defaultdict(int)
    lines: List[str] = []

    for seg in segments:
        if len(lines) >= max_lines:
            break
        seg_id = str(seg.get("id") or "")
        if not seg_id:
            continue

        if seg_id in header_ids and seen[seg_id] < 1:
            seen[seg_id] += 1
        elif seg_id in interest_ids and seen[seg_id] < 5:
            seen[seg_id] += 1
        else:
            continue

        lines.append(_reconstruct_segment(seg))

    return "\n".join(lines)


@router.post("", response_model=TranslateResponse)
async def translate(payload: TranslateRequest) -> TranslateResponse:
    transaction_type = (
        payload.transaction_type
        or payload.parsed.get("transaction_type")
        or payload.parsed.get("type")
        or "unknown"
    )

    sender = str(payload.parsed.get("sender") or "")
    receiver = str(payload.parsed.get("receiver") or "")
    date = str(payload.parsed.get("date") or "")
    header_context = {"sender": sender, "receiver": receiver, "date": date}

    segments = payload.parsed.get("segments") or []
    if not isinstance(segments, list):
        segments = []

    edi_excerpt = _build_excerpt(segments)

    prompt = build_translation_prompt(
        transaction_type=str(transaction_type),
        header_context=header_context,
        edi_excerpt=edi_excerpt,
        issues=payload.issues,
    )

    teacher_model = os.getenv("OLLAMA_TRANSLATION_TEACHER_MODEL") or os.getenv("OLLAMA_MODEL") or "llama3"

    # Translate using a self-hosted model (Ollama). Output must be JSON.
    # If the model output is malformed, we fall back to a safe empty structure.
    # (TranslateResponse defaults make this safe for the frontend.)
    # Note: we intentionally don't hard-fail the endpoint; the judge demo should degrade gracefully.
    # generate_json_response_ollama already falls back to valid JSON
    result = await generate_json_response_ollama(prompt, model=str(teacher_model), context={"transaction_type": transaction_type})

    try:
        translation_response = TranslateResponse(**result)
    except Exception:
        translation_response = TranslateResponse(
            transaction_type=str(transaction_type),
            sections={},
            issues_summary={},
            readable_walkthrough="Translation is unavailable because the self-hosted model did not return valid JSON.",
        )

    # Optionally collect training data (pseudo-labels) for later fine-tuning.
    # Enable with TRANSLATION_COLLECT_TRAINING=true
    if os.getenv("TRANSLATION_COLLECT_TRAINING", "false").lower() == "true":
        try:
            save_translation_training_example(
                transaction_type=str(transaction_type),
                header_context=header_context,
                edi_excerpt=edi_excerpt,
                issues=payload.issues,
                translation_result=translation_response.model_dump(),
                prompt_preview=prompt,
            )
        except Exception:
            # Training data collection must never break the main UX.
            pass

    return translation_response

