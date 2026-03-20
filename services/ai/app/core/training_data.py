from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional


def _default_training_path() -> Path:
    # Keep it inside the repo/workspace so hackathon runs can easily export it later.
    return Path(__file__).resolve().parent.parent / "training" / "translation_training.jsonl"


def save_translation_training_example(
    *,
    transaction_type: str,
    header_context: Dict[str, Any],
    edi_excerpt: str,
    issues: Optional[Any],
    translation_result: Dict[str, Any],
    prompt_preview: Optional[str] = None,
    training_path: Optional[Path] = None,
) -> None:
    path = training_path or _default_training_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    record: Dict[str, Any] = {
        "transaction_type": transaction_type,
        "header_context": header_context,
        "edi_excerpt": edi_excerpt,
        "issues": issues,
        "target": {
            "sections": translation_result.get("sections"),
            "readable_walkthrough": translation_result.get("readable_walkthrough", ""),
            "issues_summary": translation_result.get("issues_summary"),
        },
    }
    if prompt_preview:
        record["prompt_preview"] = prompt_preview[:800]

    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

