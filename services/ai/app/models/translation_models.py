from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class TranslateRequest(BaseModel):
    transaction_type: Optional[str] = None
    parsed: Dict[str, Any]
    issues: Optional[List[Dict[str, Any]]] = None


class TranslateResponse(BaseModel):
    transaction_type: str = "unknown"
    sections: Dict[str, Any] = Field(default_factory=dict)
    issues_summary: Dict[str, Any] = Field(default_factory=dict)
    readable_walkthrough: Optional[str] = ""

    model_config = {"extra": "allow"}

    @field_validator("readable_walkthrough", mode="before")
    @classmethod
    def coerce_none_to_empty(cls, v: Any, info: Any) -> str:
        if v and isinstance(v, str) and v.strip():
            return v

        # Generate fallback from structured data
        data = info.data if hasattr(info, "data") else {}
        sections = data.get("sections", {})
        tt = data.get("transaction_type", "EDI")
        overview = sections.get("overview", {}) or {}
        participants = sections.get("participants", {}) or {}
        issues = sections.get("issues_summary", {}) or {}

        parts = []
        sender = overview.get("sender_to_receiver", "")
        date = overview.get("transaction_date", "")
        if sender:
            parts.append(f"This is a {tt} transaction from {sender} dated {date}.")

        provider = participants.get("provider", {}) or {}
        if provider.get("name"):
            parts.append(f"Billing provider: {provider['name']} (NPI: {provider.get('npi', 'N/A')}).")

        payer = participants.get("payer", {}) or {}
        if payer.get("name"):
            parts.append(f"Payer: {payer['name']}.")

        patient = participants.get("patient_or_subscriber", {}) or {}
        if patient.get("name"):
            parts.append(f"Patient/Subscriber: {patient['name']}.")

        details = sections.get("details", {}) or {}
        members = details.get("enrollment_members", [])
        if members:
            names = ", ".join(m["member_name"] for m in members if m.get("member_name"))
            if names:
                parts.append(f"Enrolling members: {names}.")

        claims = details.get("claims", [])
        for claim in claims:
            if claim.get("billed"):
                parts.append(f"Claim billed: ${claim['billed']}, paid: ${claim.get('paid', 0)}, adjustment: ${claim.get('adjustment', 0)}.")

        errors = issues.get("total_errors", 0)
        warnings = issues.get("total_warnings", 0)
        if errors or warnings:
            parts.append(f"Transaction has {errors} error(s) and {warnings} warning(s) requiring attention before submission.")

        return " ".join(parts) if parts else f"{tt} transaction parsed successfully."
