from typing import List


def parse_segments(raw_edi: str, segment_term: str = "~", element_term: str = "*") -> List[List[str]]:
    cleaned = raw_edi.replace("\n", "").replace("\r", "")
    raw_segments = [s.strip() for s in cleaned.split(segment_term) if s.strip()]
    parsed: List[List[str]] = []
    for seg in raw_segments:
        parts = [p.strip() for p in seg.split(element_term)]
        if parts and parts[0]:
            parsed.append(parts)
    return parsed
