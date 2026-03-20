from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ParseRequest(BaseModel):
    raw_edi: str = Field(..., min_length=1)


class SegmentModel(BaseModel):
    id: str
    elements: List[str]
    index: int
    loop: str | None = None


class LoopNode(BaseModel):
    loop: str
    hl_id: Optional[str] = None
    parent_id: Optional[str] = None
    segments: List[SegmentModel]
    children: List["LoopNode"]


class ParseResponse(BaseModel):
    transaction_type: str
    type: str
    sender: str
    receiver: str
    date: str
    segments: List[SegmentModel]
    loops: List[LoopNode]
    metadata: Dict[str, Any]
