#!/bin/bash

DEMO_DIR="./demo"
ENV_DIR=".env"
cd "$DEMO_DIR" || exit

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo $OSTYPE

elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac OSX
        [[ -d "$ENV_DIR" ]] || python3 -m venv "$ENV_DIR"
        source "$ENV_DIR/bin/activate"

elif [[ "$OSTYPE" == "msys" ]]; then
        # Windows
        [[ -d "$ENV_DIR" ]] || python -m venv "$ENV_DIR"
        source "$ENV_DIR/scripts/activate"

else
        # Unknown.
        echo "unknown OS"
fi



