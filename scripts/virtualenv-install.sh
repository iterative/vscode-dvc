#!/bin/bash

# cd to demo and setup venv if needed
source ./scripts/activate-demo-venv.sh

python -m pip install --upgrade pip
pip install -U -r ./requirements.txt
