from __future__ import annotations

from typing import Dict, List

TRANSACTION_MAP = {
    "837": "837",
    "837P": "837P",
    "837I": "837I",
    "837D": "837D",
    "005010X222A1": "837P",
    "005010X223A2": "837I",
    "005010X224A2": "837D",
    "835": "835",
    "005010X221A1": "835",
    "834": "834",
    "005010X220A1": "834",
}


def _normalize_date(date_value: str) -> str:
    clean = (date_value or "").strip()
    if len(clean) == 6 and clean.isdigit():
        return f"20{clean}"
    return clean


def detect_transaction_type(segments: List[List[str]]) -> str:
    isa11 = ""
    gs01 = ""

    for segment in segments:
        if segment[0] == "ISA" and len(segment) > 11:
            isa11 = segment[11].strip()

        if segment[0] == "GS" and len(segment) > 1:
            gs01 = segment[1].strip()

        if segment[0] != "ST" or len(segment) < 2:
            continue

        st01 = segment[1].strip()
        st03 = segment[3].strip() if len(segment) > 3 else ""

        if st03 in TRANSACTION_MAP:
            return TRANSACTION_MAP[st03]
        if st01 in TRANSACTION_MAP:
            return TRANSACTION_MAP[st01]

        if "837" in st01:
            return "837"
        if "835" in st01:
            return "835"
        if "834" in st01:
            return "834"

    # Fallback inference from ISA/GS context when ST is malformed/missing.
    if gs01 == "HC":
        return "837"
    if gs01 == "HP":
        return "835"
    if gs01 == "BE":
        return "834"
    if isa11 == "^" and gs01:
        return gs01

    return "unknown"


def extract_metadata(segments: List[List[str]], transaction_type: str) -> Dict[str, str]:
    metadata: Dict[str, str] = {
        "type": transaction_type,
        "sender": "",
        "receiver": "",
        "group": "",
        "transaction_set": "",
        "date": "",
    }

    for segment in segments:
        segment_id = segment[0]
        if segment_id == "ISA":
            if len(segment) > 6:
                metadata["sender"] = segment[6].strip()
            if len(segment) > 8:
                metadata["receiver"] = segment[8].strip()
            if len(segment) > 9:
                metadata["date"] = _normalize_date(segment[9])

        if segment_id == "GS":
            if len(segment) > 1:
                metadata["group"] = segment[1].strip()
            if not metadata["sender"] and len(segment) > 2:
                metadata["sender"] = segment[2].strip()
            if not metadata["receiver"] and len(segment) > 3:
                metadata["receiver"] = segment[3].strip()
            if not metadata["date"] and len(segment) > 4:
                metadata["date"] = _normalize_date(segment[4])

        if segment_id == "ST":
            if len(segment) > 1:
                metadata["transaction_set"] = segment[1].strip()
            if len(segment) > 3 and segment[3].strip() in TRANSACTION_MAP:
                metadata["type"] = TRANSACTION_MAP[segment[3].strip()]

    return metadata
