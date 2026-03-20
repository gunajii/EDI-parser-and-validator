from __future__ import annotations

from typing import Any, Dict

SEGMENT_HINTS = {
    "NM1": "Individual or organization name and identifier information",
    "CLM": "Claim-level information including total charge amount",
    "SV1": "Professional service line details including charge amount",
    "DTP": "Date or time period information",
    "INS": "Member maintenance status and eligibility indicators",
    "CLP": "Claim payment information in an 835 remittance",
}


def build_context(transaction_type: str, segment: str, error: str, value: str | None = None) -> Dict[str, Any]:
    return {
        "transaction_type": transaction_type,
        "segment": segment,
        "segment_meaning": SEGMENT_HINTS.get(segment, "EDI segment"),
        "value": value or "",
        "error": error,
    }
