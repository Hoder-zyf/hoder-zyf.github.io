#!/bin/bash
# Simple script to start a local web server

echo "Starting local web server..."
echo "Opening http://localhost:8000 in your browser..."
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server 8032
elif command -v python &> /dev/null; then
    python -m http.server 8032
else
    echo "Error: Python is not installed!"
    exit 1
fi

