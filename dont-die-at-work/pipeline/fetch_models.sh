#!/usr/bin/env bash
# Downloads the models the pipeline runs locally. Nothing here needs an API key.
#   Kokoro-82M (Apache-2.0)        - narrator voice
#   faster-whisper small.en (MIT)  - word-level caption timing + pronunciation QA
set -euo pipefail
cd "$(dirname "$0")/../models" 2>/dev/null || { mkdir -p "$(dirname "$0")/../models"; cd "$(dirname "$0")/../models"; }
HF=https://huggingface.co
get() { [ -s "$2" ] || curl -fL --retry 4 -o "$2" "$HF/$1"; }
get fastrtc/kokoro-onnx/resolve/main/kokoro-v1.0.onnx kokoro-v1.0.onnx
get fastrtc/kokoro-onnx/resolve/main/voices-v1.0.bin voices-v1.0.bin
mkdir -p faster-whisper-small.en
for f in config.json model.bin tokenizer.json vocabulary.txt; do
  get "Systran/faster-whisper-small.en/resolve/main/$f" "faster-whisper-small.en/$f"
done
echo "models ready in $(pwd)"
