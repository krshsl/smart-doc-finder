#!/bin/bash

# TODO: maybe use a docker to setup everything in the future??

if ! command -v tmux >/dev/null 2>&1; then
  echo "Error: tmux is not installed. Please install it and try again."
  exit 1
fi

SESSION="smart-doc-finder"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

tmux new-session -d -s $SESSION
tmux send-keys -t $SESSION "cd $SCRIPT_DIR/frontend && npm run dev" C-m
tmux split-window -h -t $SESSION
tmux send-keys -t $SESSION:0.1 "cd $SCRIPT_DIR/backend && source .venv/bin/activate && fastapi run src/app.py --reload --port 8000" C-m
tmux attach-session -t $SESSION
