#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: bash scripts/extract-pdf-text.sh <input.pdf> <output.txt>" >&2
  exit 1
fi

input="$1"
output="$2"

mkdir -p "$(dirname "$output")"

if command -v pdftotext >/dev/null 2>&1; then
  pdftotext -layout -enc UTF-8 "$input" "$output"
else
  echo "pdftotext is required. Install poppler or use /opt/homebrew/bin/pdftotext." >&2
  exit 1
fi

echo "Extracted text: $output"
