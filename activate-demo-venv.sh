#!/bin/bash

DEMO_DIR="./demo"
ENV_DIR=".env"

cd "$DEMO_DIR"

[[ -d "$ENV_DIR" ]] || python3 -m venv "$ENV_DIR"

source "$ENV_DIR/bin/activate"
