#!/usr/bin/env bash
# Bir bölümü baştan sona üretir: video render + müzik + birleştirme + kontrol karesi.
# Kullanım: tools/build.sh episodes/002-ornek [tohum] [ton]
set -euo pipefail
EP=${1%/}; SEED=${2:-$RANDOM}; KEY=${3:-am}
ROOT=$(cd "$(dirname "$0")/.." && pwd); cd "$ROOT"
WORK=$(mktemp -d)
echo "== render: $EP"
python3 tools/render.py "$EP" full "$WORK/v.mp4"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORK/v.mp4")
echo "== müzik: $DUR sn (tohum $SEED, ton $KEY)"
python3 tools/music.py "$DUR" "$WORK/m.wav" "$SEED" "$KEY"
ffmpeg -v error -y -i "$WORK/v.mp4" -i "$WORK/m.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$EP/video.mp4"
ffmpeg -v error -y -i "$EP/video.mp4" -vf "fps=1/3,scale=180:-1,tile=8x4" -frames:v 1 "$EP/kontrol.jpg"
ffprobe -v error -show_entries format=duration,size:stream=width,height -of compact "$EP/video.mp4"
echo "== hazır: $EP/video.mp4  (kontrol: $EP/kontrol.jpg)"
