#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKPOINTS_DIR="${ROOT_DIR}/storage/models/openvoice/checkpoints_v2"
BASE_URL="${OPENVOICE_BASE_URL:-https://huggingface.co/myshell-ai/OpenVoiceV2/resolve/main}"
FORCE=0

usage() {
  cat <<'EOF'
Usage: ./scripts/setup-openvoice.sh [--force]

Downloads the minimum OpenVoice V2 checkpoint files required by this project:
  - converter/config.json
  - converter/checkpoint.pth
  - base_speakers/ses/kr.pth

Options:
  --force    Re-download files even if they already exist
  -h, --help Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v curl >/dev/null 2>&1; then
  echo "error: curl is required. Install curl and retry." >&2
  exit 1
fi

mkdir -p \
  "${CHECKPOINTS_DIR}/converter" \
  "${CHECKPOINTS_DIR}/base_speakers/ses"

download_file() {
  local relative_path="$1"
  local destination="${CHECKPOINTS_DIR}/${relative_path}"
  local url="${BASE_URL}/${relative_path}"

  if [[ -f "${destination}" && "${FORCE}" -ne 1 ]]; then
    echo "skip: ${relative_path}"
    return 0
  fi

  echo "download: ${relative_path}"
  curl --fail --location --retry 3 --retry-delay 2 \
    "${url}" \
    --output "${destination}"
}

download_file "converter/config.json"
download_file "converter/checkpoint.pth"
download_file "base_speakers/ses/kr.pth"

echo
echo "OpenVoice checkpoints are ready under:"
echo "  ${CHECKPOINTS_DIR}"
echo
echo "Verify with:"
echo "  curl http://127.0.0.1:8000/api/v1/openvoice/status"
