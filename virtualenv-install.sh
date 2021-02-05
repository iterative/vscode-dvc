#!/bin/bash

# cd to demo and setup venv if needed
source ./activate-demo-venv.sh

# Ensure pip is upgraded to we can install tensorflow>=2
pip install -U pip
pip install -U setuptools
pip install -r ./requirements.txt
