import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.edi_parser import parse_edi


def test_parse_edi_detects_837_and_segments():
    edi = "ISA*00*          *00*          *ZZ*SENDER*ZZ*RECEIVER*240101*1253*^*00501*000000905*0*T*:~GS*HC*SEND*RECV*20240101*1253*1*X*005010X222A1~ST*837*0001*005010X222A1~BHT*0019*00*0123*20240101*1319*CH~SE*4*0001~GE*1*1~IEA*1*000000905~"
    parsed = parse_edi(edi)
    assert parsed["transaction_type"] == "837P"
    assert parsed["metadata"]["segment_count"] >= 4
    assert parsed["sender"] == "SENDER"
    assert parsed["receiver"] == "RECEIVER"


def test_parse_edi_builds_hl_hierarchy():
    edi = (
        "ST*837*0001*005010X222A1~"
        "HL*1**20*1~"
        "NM1*85*2*BILLING*****XX*123~"
        "HL*2*1*22*1~"
        "NM1*IL*1*DOE*JOHN****MI*SUB123~"
        "HL*3*2*23*0~"
        "NM1*QC*1*DOE*JANE~"
        "SE*8*0001~"
    )
    parsed = parse_edi(edi)

    assert isinstance(parsed["loops"], list)
    assert len(parsed["loops"]) == 1
    root = parsed["loops"][0]
    assert root["hl_id"] == "1"
    assert len(root["children"]) == 1
    assert root["children"][0]["hl_id"] == "2"
    assert root["children"][0]["children"][0]["hl_id"] == "3"
