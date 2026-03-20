from __future__ import annotations

from typing import Any, Dict, List, Optional

LOOP_BY_SEGMENT: Dict[str, str] = {
    "ISA": "INTERCHANGE",
    "GS": "FUNCTIONAL_GROUP",
    "ST": "TRANSACTION_SET",
    "BHT": "HEADER",
    "NM1": "NAME",
    "CLM": "2300",
    "LX": "2400",
    "INS": "2000",
    "CLP": "2100",
}

HL_LOOP_MAP: Dict[str, str] = {
    "20": "2000A",  # Information source / billing provider
    "21": "2000A",  # Legacy variant seen in some partner guides
    "22": "2000B",  # Subscriber
    "23": "2000C",  # Patient / dependent
}


def _segment_to_model(segment: List[str], index: int, loop_id: str) -> Dict[str, Any]:
    return {
        "id": segment[0],
        "elements": segment[1:],
        "index": index,
        "loop": loop_id,
    }


def _new_hl_node(hl_id: str, parent_id: Optional[str], loop_id: str, index: int, segment: List[str]) -> Dict[str, Any]:
    return {
        "loop": loop_id,
        "hl_id": hl_id,
        "parent_id": parent_id,
        "segments": [_segment_to_model(segment, index, loop_id)],
        "children": [],
    }


def build_loops(segments: List[List[str]]) -> List[Dict[str, Any]]:
    """
    Build an HL hierarchy for healthcare transactions.

    HL structure: HL*ID*PARENT_ID*LEVEL_CODE
    - HL01 => current hierarchy id
    - HL02 => parent id (optional on root)
    - HL03 => hierarchical level code (mapped to loop names)
    """
    hl_nodes: Dict[str, Dict[str, Any]] = {}
    roots: List[Dict[str, Any]] = []
    current_hl_node: Optional[Dict[str, Any]] = None

    for index, segment in enumerate(segments):
        segment_id = segment[0]

        if segment_id == "HL":
            hl_id = segment[1].strip() if len(segment) > 1 and segment[1].strip() else str(index)
            parent_id = segment[2].strip() if len(segment) > 2 and segment[2].strip() else None
            hl_code = segment[3].strip() if len(segment) > 3 else ""
            loop_id = HL_LOOP_MAP.get(hl_code, f"HL_{hl_code}" if hl_code else "2000")

            node = _new_hl_node(hl_id=hl_id, parent_id=parent_id, loop_id=loop_id, index=index, segment=segment)
            hl_nodes[hl_id] = node

            if parent_id and parent_id in hl_nodes:
                hl_nodes[parent_id]["children"].append(node)
            else:
                roots.append(node)

            current_hl_node = node
            continue

        if current_hl_node:
            current_hl_node["segments"].append(_segment_to_model(segment, index, current_hl_node["loop"]))

    return roots
