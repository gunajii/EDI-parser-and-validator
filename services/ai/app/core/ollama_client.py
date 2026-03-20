from __future__ import annotations

import os
import traceback
from typing import Any, Dict, Optional

import httpx

from app.core.llm_client import _extract_first_json_object


def _fallback_json(context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    tx = None
    if context:
        tx = context.get("transaction_type")
    return {
        "transaction_type": tx or "unknown",
        "sections": {},
        "issues_summary": {},
        "readable_walkthrough": "Translation is unavailable because the Ollama inference endpoint did not return valid JSON.",
    }


async def generate_json_response_ollama(prompt: str, *, model: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")

    base_payload: Dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))},
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            try_payload = {**base_payload, "format": "json"}
            resp = await client.post(f"{ollama_url}/api/generate", json=try_payload)
        resp.raise_for_status()
        data = resp.json()
        text = data.get("response") or ""
        print("OLLAMA RAW RESPONSE:", repr(text[:500]), flush=True)
        parsed = _extract_first_json_object(str(text))
        print("PARSED RESULT:", parsed, flush=True)
        return parsed if parsed is not None else _fallback_json(context)
    except Exception as e:
        print("OLLAMA EXCEPTION:", type(e).__name__, str(e), flush=True)
        traceback.print_exc()
        return _fallback_json(context)
