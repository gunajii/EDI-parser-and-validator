from __future__ import annotations

from typing import Any, Dict


def build_prompt(question: str, context: Dict[str, Any]) -> str:
    return (
        "You are a healthcare EDI expert assistant. "
        "Provide a practical response with three sections: "
        "(1) what the segment means, "
        "(2) why this validation error happens, "
        "(3) exactly how to fix it in the EDI file.\n\n"
        f"Transaction: {context.get('transaction_type', 'unknown')}\n"
        f"Segment: {context.get('segment', 'unknown')}\n"
        f"Segment meaning hint: {context.get('segment_meaning', 'N/A')}\n"
        f"Current value: {context.get('value', '')}\n"
        f"Validation error: {context.get('error', '')}\n"
        f"User question: {question}\n\n"
        "Keep the answer concise, actionable, and avoid generic advice."
    )


def build_translation_prompt(
    *,
    transaction_type: str,
    header_context: Dict[str, Any],
    edi_excerpt: str,
    issues: Any | None = None,
) -> str:
    """
    Produce a structured, sectioned human-readable narrative.
    The model MUST return ONLY valid JSON.
    """

    issues_block = ""
    if issues:
        # Keep the prompt small: only pass the top issues' code/message.
        trimmed = issues[:8] if isinstance(issues, list) else []
        issues_block = f"\n\nTop validation issues (optional context):\n{trimmed}"

    return (
        "You are a healthcare EDI translator and narrator. "
        "Using the provided EDI excerpt, write a human-readable explanation of the transaction.\n\n"
        "Return ONLY valid JSON with this top-level structure:\n"
        "{\n"
        '  "transaction_type": "string",\n'
        '  "sections": {\n'
        '    "overview": {\n'
        '      "summary": "string",\n'
        '      "sender_to_receiver": "string",\n'
        '      "transaction_date": "string"\n'
        "    },\n"
        '    "participants": {\n'
        '      "provider": { "name": "string", "npi": "string|null" },\n'
        '      "payer": { "name": "string", "payer_id": "string|null" },\n'
        '      "patient_or_subscriber": { "name": "string|null", "id": "string|null" }\n'
        "    },\n"
        '    "details": {\n'
        '      "claims": [\n'
        '        { "claim_id": "string|null", "status": "string|null", "billed": "number|null", "paid": "number|null", "adjustment": "number|null" }\n'
        "      ],\n"
        '      "remittance_lines": [\n'
        '        { "claim_id": "string|null", "amount": "number|null", "adjustment_notes": ["string"] }\n'
        "      ],\n"
        '      "enrollment_members": [\n'
        '        { "member_name": "string|null", "member_id": "string|null", "status": "string|null", "plan": "string|null", "effective_date": "string|null" }\n'
        "      ]\n"
        "    },\n"
        '    "issues_summary": {\n'
        '      "total_errors": "number",\n'
        '      "total_warnings": "number",\n'
        '      "top_issues": [ { "severity": "string", "code": "string", "message": "string" } ]\n'
        "    }\n"
        "  },\n"
        '  "readable_walkthrough": "string"\n'
        "}\n\n"
        "Rules:\n"
        "- Populate only what you can infer from the excerpt. Use null where unknown.\n"
        "- For 837: focus on CLM/SV1 claim-level information.\n"
        "- For 835: focus on CLP payment/adjustment claim-level information and remittance header.\n"
        "- For 834: focus on INS/REF/NM1/HD/DTP member enrollment information.\n"
        f"- transaction_type is: {transaction_type}\n"
        f"Sender/receiver/date context: {header_context}\n\n"
        f"EDI excerpt (key segments):\n{edi_excerpt}\n"
        f"{issues_block}\n\n"
        "Return ONLY JSON. No markdown, no commentary. The readable_walkthrough field MUST be a non-empty plain English summary of the transaction — never null or empty string. The readable_walkthrough field MUST be a non-empty string summarizing the transaction in plain English. Never return null for readable_walkthrough."
    )
