from fastapi import APIRouter

from app.core.edi_parser import parse_edi
from app.models.edi_models import ParseRequest, ParseResponse

router = APIRouter(prefix="/parse", tags=["parse"])


@router.post("", response_model=ParseResponse)
def parse_endpoint(payload: ParseRequest) -> ParseResponse:
    return ParseResponse(**parse_edi(payload.raw_edi))
