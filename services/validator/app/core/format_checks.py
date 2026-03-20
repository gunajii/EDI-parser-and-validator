import re
from typing import Dict, List

NPI_REGEX = re.compile(r"^\d{10}$")
DATE_REGEX = re.compile(r"^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$")
ZIP_REGEX = re.compile(r"^\d{5}(-\d{4})?$")


def run_format_checks(segments: List[Dict]) -> List[Dict]:
    issues: List[Dict] = []

    for segment in segments:
        segment_id = segment.get("id")
        elements = segment.get("elements", [])

        if segment_id == "NM1" and len(elements) >= 9:
            npi = elements[8]
            if npi and not NPI_REGEX.match(npi):
                issues.append(
                    {
                        "severity": "error",
                        "code": "INVALID_NPI",
                        "message": "NPI must be 10 numeric digits.",
                        "loop": segment.get("loop"),
                        "segment": "NM1",
                        "element_position": 9,
                        "fix_suggestion": "Use a valid 10-digit NPI in NM109.",
                    }
                )

        if segment_id in {"DMG", "DTP"} and len(elements) >= 3:
            date_value = elements[2]
            if date_value and not DATE_REGEX.match(date_value):
                issues.append(
                    {
                        "severity": "error",
                        "code": "INVALID_DATE",
                        "message": "Date must follow YYYYMMDD.",
                        "loop": segment.get("loop"),
                        "segment": segment_id,
                        "element_position": 3,
                        "fix_suggestion": "Use YYYYMMDD date format.",
                    }
                )

        if segment_id == "N4" and len(elements) >= 3:
            zip_value = elements[2]
            if zip_value and not ZIP_REGEX.match(zip_value):
                issues.append(
                    {
                        "severity": "error",
                        "code": "INVALID_ZIP",
                        "message": "ZIP must be 5 digits or ZIP+4.",
                        "loop": segment.get("loop"),
                        "segment": "N4",
                        "element_position": 3,
                        "fix_suggestion": "Use ZIP format 12345 or 12345-6789.",
                    }
                )

    return issues
