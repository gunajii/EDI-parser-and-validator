from __future__ import annotations

from typing import Any, Dict, List

from app.core.code_validators import run_code_checks
from app.core.cross_checks import run_cross_checks
from app.core.format_checks import run_format_checks
from app.core.rule_engine import run_json_rules, run_required_segment_rules


def _normalize_issue(issue: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(issue)
    normalized.setdefault("severity", "error")
    normalized.setdefault("message", normalized.get("error", "Validation issue"))
    normalized.setdefault("error", normalized.get("message", "Validation issue"))
    normalized.setdefault("explanation", normalized.get("message", "Validation rule failed."))
    normalized.setdefault("suggestion", normalized.get("fix_suggestion", "Review transaction and correct value."))
    normalized.setdefault("fix_suggestion", normalized.get("suggestion"))
    normalized.setdefault("value", None)
    normalized.setdefault("element", None)
    return normalized


def validate(transaction_type: str, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
    issues: List[Dict[str, Any]] = []
    issues.extend(run_required_segment_rules(transaction_type, segments))
    issues.extend(run_json_rules(transaction_type, segments))
    issues.extend(run_format_checks(segments))
    issues.extend(run_code_checks(segments))
    issues.extend(run_cross_checks(transaction_type, segments))

    normalized_issues = [_normalize_issue(issue) for issue in issues]

    errors = sum(1 for issue in normalized_issues if issue["severity"] == "error")
    warnings = sum(1 for issue in normalized_issues if issue["severity"] == "warning")

    return {
        "transaction_type": transaction_type,
        "is_valid": errors == 0,
        "issues": normalized_issues,
        "summary": {"total": len(normalized_issues), "errors": errors, "warnings": warnings},
    }
