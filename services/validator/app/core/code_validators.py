from typing import Dict, List


def run_code_checks(segments: List[Dict]) -> List[Dict]:
    issues: List[Dict] = []
    for segment in segments:
        if segment.get("id") == "NM1" and len(segment.get("elements", [])) >= 8:
            qualifier = segment["elements"][7]
            if qualifier and qualifier not in {"XX", "34", "24", "MI"}:
                issues.append(
                    {
                        "severity": "warning",
                        "code": "UNEXPECTED_QUALIFIER",
                        "message": f"NM108 qualifier '{qualifier}' is uncommon.",
                        "loop": segment.get("loop"),
                        "segment": "NM1",
                        "element_position": 8,
                        "fix_suggestion": "Confirm NM108 against payer companion guide.",
                    }
                )
    return issues
