from fastapi import APIRouter

from app.core.validator import validate
from app.models.validation_models import ValidationRequest, ValidationResponse

router = APIRouter(prefix="/validate", tags=["validate"])


@router.post("", response_model=ValidationResponse)
def validate_endpoint(payload: ValidationRequest) -> ValidationResponse:
    return ValidationResponse(**validate(payload.transaction_type, payload.segments))
