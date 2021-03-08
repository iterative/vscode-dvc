#!/bin/bash

DEMO_DIR="./demo"
ENV_DIR=".env"
cd "$DEMO_DIR" || exit

if [[ "$OSTYPE" == "msys" ]]; then
        # Windows
        [[ -d "$ENV_DIR" ]] || python -m venv "$ENV_DIR"
        source "$ENV_DIR/scripts/activate"

else
        # All others
        [[ -d "$ENV_DIR" ]] || python3 -m venv "$ENV_DIR"
        source "$ENV_DIR/bin/activate"
fi



