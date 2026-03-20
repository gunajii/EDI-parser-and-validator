from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

RULES_DIR = Path(__file__).resolve().parent.parent / "rules"


class RuleEngine:
    def __init__(self, rules_dir: Path = RULES_DIR) -> None:
        self.rules_dir = rules_dir

    def load_rules(self, transaction_type: str) -> Dict[str, Any]:
        rule_path = self.rules_dir / f"{transaction_type}_rules.json"
        if not rule_path.exists():
            return {"required_segments": [], "rules": []}
        with rule_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)


ENGINE = RuleEngine()


def _element_index(element_ref: str) -> int:
    digits = "".join(ch for ch in element_ref if ch.isdigit())
    if not digits:
        return 0
    return int(digits.lstrip("0") or "0")


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
    severity: str = "error",
) -> Dict[str, Any]:
    return {
        "severity": severity,
        "code": code,
        "message": error,
        "loop": loop,
        "segment": segment,
        "element": element,
        "element_position": _element_index(element) if element else None,
        "value": value,
        "error": error,
        "explanation": explanation,
        "suggestion": suggestion,
        "fix_suggestion": suggestion,
    }


def _get_value(segment: Dict[str, Any], element_ref: str) -> str:
    idx = _element_index(element_ref)
    if idx <= 0:
        return ""
    elements = segment.get("elements", [])
    return str(elements[idx - 1]).strip() if len(elements) >= idx else ""


def run_required_segment_rules(transaction_type: str, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    ruleset = ENGINE.load_rules(transaction_type)
    required_segments = ruleset.get("required_segments", [])
    existing = {segment.get("id") for segment in segments}

    return [
        _mk_issue(
            loop="structural",
            segment=required_segment,
            element=None,
            value=None,
            error=f"Required segment '{required_segment}' is missing.",
            explanation="The implementation guide requires this segment for a valid transaction envelope.",
            suggestion=f"Add {required_segment} in the correct loop.",
            code="MISSING_SEGMENT",
        )
        for required_segment in required_segments
        if required_segment not in existing
    ]


def _validate_rule(rule: Dict[str, Any], segment: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    element_ref = rule.get("element")
    if not element_ref:
        return None

    value = _get_value(segment, element_ref)

    if rule.get("required") and not value:
        return _mk_issue(
            loop=segment.get("loop"),
            segment=segment.get("id", ""),
            element=element_ref,
            value=value,
            error=rule.get("error", "Required element missing"),
            explanation=rule.get("explanation", f"{element_ref} is required by the transaction guide."),
            suggestion=rule.get("suggestion", "Populate the missing value."),
            code="REQUIRED_FIELD",
        )

    if not value:
        return None

    pattern = rule.get("pattern")
    if pattern and not re.fullmatch(pattern, value):
        return _mk_issue(
            loop=segment.get("loop"),
            segment=segment.get("id", ""),
            element=element_ref,
            value=value,
            error=rule.get("error", "Invalid format"),
            explanation=rule.get("explanation", f"{element_ref} does not satisfy the required regex pattern."),
            suggestion=rule.get("suggestion", "Correct the value format."),
            code="REGEX_VALIDATION",
        )

    exact_length = rule.get("length")
    min_len = rule.get("min_length", exact_length)
    max_len = rule.get("max_length", exact_length)

    if min_len is not None and len(value) < int(min_len):
        return _mk_issue(
            loop=segment.get("loop"),
            segment=segment.get("id", ""),
            element=element_ref,
            value=value,
            error=rule.get("error", "Value too short"),
            explanation=rule.get("explanation", f"{element_ref} must be at least {min_len} characters."),
            suggestion=rule.get("suggestion", f"Use a value with at least {min_len} characters."),
            code="LENGTH_VALIDATION",
        )

    if max_len is not None and len(value) > int(max_len):
        return _mk_issue(
            loop=segment.get("loop"),
            segment=segment.get("id", ""),
            element=element_ref,
            value=value,
            error=rule.get("error", "Value too long"),
            explanation=rule.get("explanation", f"{element_ref} must be no more than {max_len} characters."),
            suggestion=rule.get("suggestion", f"Use a value with no more than {max_len} characters."),
            code="LENGTH_VALIDATION",
        )

    allowed = rule.get("enum")
    if allowed and value not in set(allowed):
        return _mk_issue(
            loop=segment.get("loop"),
            segment=segment.get("id", ""),
            element=element_ref,
            value=value,
            error=rule.get("error", "Invalid code value"),
            explanation=rule.get("explanation", f"{element_ref} must match one of the allowed code values."),
            suggestion=rule.get("suggestion", f"Use one of: {', '.join(allowed)}."),
            code="ENUM_VALIDATION",
        )

    return None


def run_json_rules(transaction_type: str, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    ruleset = ENGINE.load_rules(transaction_type)
    raw_rules = ruleset.get("rules", [])
    issues: List[Dict[str, Any]] = []

    for segment in segments:
        for rule in raw_rules:
            if segment.get("id") != rule.get("segment"):
                continue
            issue = _validate_rule(rule, segment)
            if issue:
                issues.append(issue)

    return issues
