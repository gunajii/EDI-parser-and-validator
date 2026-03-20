from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional


def _mk_issue(
    *,
    loop: Optional[str],
    segment: str,
    element: Optional[str],
    value: Optional[str],
    error: str,
    explanation: str,
    suggestion: str,
    code: str,
) -> Dict[str, Any]:
    return {
        "severity": "error",
        "code": code,
        "message": error,
        "loop": loop,
        "segment": segment,
        "element": element,
        "element_position": None,
        "value": value,
        "error": error,
        "explanation": explanation,
        "suggestion": suggestion,
        "fix_suggestion": suggestion,
    }


def _parse_date(value: str) -> Optional[datetime]:
    for fmt in ("%Y%m%d", "%y%m%d", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _to_float(value: str | None) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _claim_total_check(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    issues: List[Dict[str, Any]] = []
    current_claim_total: Optional[float] = None
    current_claim_id: Optional[str] = None
    service_sum = 0.0

    def flush_claim() -> None:
        nonlocal current_claim_total, current_claim_id, service_sum
        if current_claim_total is None:
            return
        if round(current_claim_total, 2) != round(service_sum, 2):
            issues.append(
                _mk_issue(
                    loop="2300",
                    segment="CLM",
                    element="CLM02",
                    value=str(current_claim_total),
                    error="Claim total does not match service line sum",
                    explanation=f"CLM02 total ({current_claim_total:.2f}) must equal summed SV1 charges ({service_sum:.2f}) for claim {current_claim_id or 'unknown'}.",
                    suggestion="Update CLM02 or SV1 line amounts so totals match.",
                    code="CLAIM_TOTAL_MISMATCH",
                )
            )
        current_claim_total = None
        current_claim_id = None
        service_sum = 0.0

    for segment in segments:
        if segment.get("id") == "CLM":
            flush_claim()
            elements = segment.get("elements", [])
            current_claim_id = elements[0] if len(elements) > 0 else None
            current_claim_total = _to_float(elements[1] if len(elements) > 1 else None)
        elif segment.get("id") == "SV1" and current_claim_total is not None:
            elements = segment.get("elements", [])
            service_sum += _to_float(elements[1] if len(elements) > 1 else None)

    flush_claim()
    return issues


def _dob_before_claim_check(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    issues: List[Dict[str, Any]] = []
    dob: Optional[datetime] = None
    claim_date: Optional[datetime] = None

    for segment in segments:
        if segment.get("id") == "DMG":
            elements = segment.get("elements", [])
            if len(elements) > 1:
                dob = _parse_date(elements[1])

        if segment.get("id") == "DTP":
            elements = segment.get("elements", [])
            if len(elements) > 2 and elements[0] in {"431", "434"}:
                claim_date = _parse_date(elements[2])

    if dob and claim_date and dob >= claim_date:
        issues.append(
            _mk_issue(
                loop="2000C",
                segment="DMG",
                element="DMG02",
                value=dob.strftime("%Y%m%d"),
                error="DOB must be earlier than claim date",
                explanation=f"Patient DOB ({dob.date()}) must occur before claim date ({claim_date.date()}).",
                suggestion="Correct DMG02 or DTP claim date values.",
                code="DOB_AFTER_CLAIM_DATE",
            )
        )

    return issues


def _subscriber_consistency_check(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    issues: List[Dict[str, Any]] = []
    subscriber_ids = set()

    for segment in segments:
        if segment.get("id") != "NM1":
            continue
        elements = segment.get("elements", [])
        if len(elements) > 8 and elements[0] == "IL" and elements[7] == "MI":
            subscriber_ids.add(elements[8])

    if len(subscriber_ids) > 1:
        issues.append(
            _mk_issue(
                loop="2000B",
                segment="NM1",
                element="NM109",
                value=", ".join(sorted(subscriber_ids)),
                error="Inconsistent subscriber IDs across transaction",
                explanation="Subscriber identifiers should remain consistent across all subscriber NM1 segments.",
                suggestion="Use a single subscriber ID in all related loops.",
                code="SUBSCRIBER_ID_MISMATCH",
            )
        )

    return issues


def run_cross_checks(transaction_type: str, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if transaction_type not in {"837", "837P", "837I", "837D"}:
        return []

    issues: List[Dict[str, Any]] = []
    issues.extend(_claim_total_check(segments))
    issues.extend(_dob_before_claim_check(segments))
    issues.extend(_subscriber_consistency_check(segments))
    return issues
