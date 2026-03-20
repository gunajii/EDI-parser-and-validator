from __future__ import annotations

from typing import Any, Dict, List

from app.core.loop_builder import LOOP_BY_SEGMENT, build_loops
from app.core.segment_parser import parse_segments
from app.core.transaction_detector import detect_transaction_type, extract_metadata


def _build_segment_view(segments: List[List[str]], loop_roots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    loop_by_index: Dict[int, str] = {}

    def walk(node: Dict[str, Any]) -> None:
        for segment in node.get("segments", []):
            loop_by_index[segment["index"]] = node.get("loop", "UNMAPPED")
        for child in node.get("children", []):
            walk(child)

    for root in loop_roots:
        walk(root)

    segment_view = []
    for index, segment in enumerate(segments):
        segment_id = segment[0]
        segment_view.append(
            {
                "id": segment_id,
                "elements": segment[1:],
                "index": index,
                "loop": loop_by_index.get(index, LOOP_BY_SEGMENT.get(segment_id, "UNMAPPED")),
            }
        )

    return segment_view


def _to_float(value: str | None) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _extract_835_claims(segments: List[List[str]]) -> List[Dict[str, Any]]:
    claims: List[Dict[str, Any]] = []

    for segment in segments:
        if segment[0] != "CLP":
            continue

        claim = {
            "claim_id": segment[1] if len(segment) > 1 else "",
            "status": segment[2] if len(segment) > 2 else "",
            "billed": _to_float(segment[3] if len(segment) > 3 else None),
            "paid": _to_float(segment[4] if len(segment) > 4 else None),
            "adjustments": _to_float(segment[5] if len(segment) > 5 else None),
        }
        claims.append(claim)

    return claims


def _extract_834_members(segments: List[List[str]]) -> List[Dict[str, Any]]:
    members: List[Dict[str, Any]] = []
    current: Dict[str, Any] | None = None

    for segment in segments:
        segment_id = segment[0]

        if segment_id == "INS":
            if current:
                members.append(current)
            current = {
                "member_id": "",
                "name": "",
                "status": segment[1] if len(segment) > 1 else "",
                "plan": "",
            }
            continue

        if not current:
            continue

        if segment_id == "REF" and len(segment) > 2 and segment[1] == "0F":
            current["member_id"] = segment[2]

        if segment_id == "NM1" and len(segment) > 4 and segment[1] == "IL":
            current["name"] = " ".join(part for part in [segment[3], segment[4]] if part)

        if segment_id == "HD" and len(segment) > 3:
            current["plan"] = segment[3]

    if current:
        members.append(current)

    return members


def parse_edi(raw_edi: str) -> Dict[str, Any]:
    segments = parse_segments(raw_edi)
    transaction_type = detect_transaction_type(segments)
    loop_tree = build_loops(segments)
    segment_view = _build_segment_view(segments, loop_tree)
    metadata = extract_metadata(segments, transaction_type)

    enriched_metadata: Dict[str, Any] = {
        **metadata,
        "segment_count": len(segments),
        "has_interchange": any(segment[0] == "ISA" for segment in segments),
        "has_functional_group": any(segment[0] == "GS" for segment in segments),
    }

    if transaction_type == "835":
        enriched_metadata["claims"] = _extract_835_claims(segments)

    if transaction_type == "834":
        enriched_metadata["members"] = _extract_834_members(segments)

    return {
        "transaction_type": transaction_type,
        "type": transaction_type,
        "sender": metadata.get("sender", ""),
        "receiver": metadata.get("receiver", ""),
        "date": metadata.get("date", ""),
        "segments": segment_view,
        "loops": loop_tree,
        "metadata": enriched_metadata,
    }
