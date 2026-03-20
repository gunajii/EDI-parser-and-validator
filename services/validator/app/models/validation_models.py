from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ValidationIssue(BaseModel):
    severity: str
    code: str
    message: str
    loop: Optional[str] = None
    segment: Optional[str] = None
    element: Optional[str] = None
    element_position: Optional[int] = None
    value: Optional[str] = None
    error: Optional[str] = None
    explanation: Optional[str] = None
    suggestion: Optional[str] = None
    fix_suggestion: Optional[str] = None


class ValidationRequest(BaseModel):
    transaction_type: str
    segments: List[Dict[str, Any]]


class ValidationResponse(BaseModel):
    transaction_type: str
    is_valid: bool
    issues: List[ValidationIssue]
    summary: Dict[str, int]
