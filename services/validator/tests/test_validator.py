import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.validator import validate


def test_validate_detects_missing_segments():
    result = validate("837", [{"id": "ST", "elements": ["837"], "index": 0, "loop": "TRANSACTION_SET"}])
    assert result["is_valid"] is False
    issue = next(issue for issue in result["issues"] if issue["code"] == "MISSING_SEGMENT")
    assert "segment" in issue
    assert "element" in issue
    assert "error" in issue
    assert "explanation" in issue
    assert "suggestion" in issue
