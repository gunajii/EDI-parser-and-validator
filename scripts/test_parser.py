import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "services" / "parser"))
from app.core.edi_parser import parse_edi

sample = "ISA*00*          *00*          *ZZ*SUBMITTER      *ZZ*RECEIVER       *240101*1200*^*00501*000000001*0*T*:~GS*HC*SENDER*RECEIVER*20240101*1200*1*X*005010X222A1~ST*837*0001~BHT*0019*00*0123*20240101*1200*CH~NM1*41*2*ABC BILLING*****46*12345~CLM*CLAIM123*125***11:B:1*Y*A*Y*Y~SE*6*0001~GE*1*1~IEA*1*000000001~"
result = parse_edi(sample)
print(json.dumps({"transaction": result["transaction_type"], "segments": len(result["segments"])}, indent=2))
