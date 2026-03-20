#!/usr/bin/env bash
set -euo pipefail

python -m uvicorn services.parser.app.main:app --host 0.0.0.0 --port 8001 &
P1=$!
python -m uvicorn services.validator.app.main:app --host 0.0.0.0 --port 8002 &
P2=$!
python -m uvicorn services.ai.app.main:app --host 0.0.0.0 --port 8003 &
P3=$!

echo "Parser: 8001, Validator: 8002, AI: 8003"
wait $P1 $P2 $P3
