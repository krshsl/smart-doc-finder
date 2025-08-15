#!/bin/sh
set -e

echo "Running pre-start script..."
python3 scripts/download_model.py

echo "Starting backend in $ENV mode..."
if [ "$ENV" = "dev" ]; then
    exec uvicorn src.main:app \
      --host 0.0.0.0 \
      --port 8000 \
      --workers 2 \
      --loop uvloop \
      --http httptools \
      --limit-concurrency ${MAX_CONCURRENT_REQUESTS:-16} \
      --backlog 24 \
      --timeout-keep-alive 5 \
      --limit-max-requests 300 \
      --reload
else
    exec uvicorn src.main:app \
      --host 0.0.0.0 \
      --port 8000 \
      --workers 1 \
      --loop uvloop \
      --http httptools \
      --limit-concurrency ${MAX_CONCURRENT_REQUESTS:-8} \
      --backlog 12 \
      --timeout-keep-alive 2 \
      --limit-max-requests 150 \
      --log-level warning
fi
