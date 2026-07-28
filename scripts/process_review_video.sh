#!/usr/bin/env bash
set -e
FF="C:/Users/AbdallaMon/AppData/Local/Programs/Python/Python310/lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/web/public/images/review.mp4"
OUTDIR="$ROOT/web/public/videos"
# Montage + exposure/colour fix + gentle sharpen + fades; web-optimised H.264 (faststart) with normalised loudness.
"$FF" -y -hide_banner -loglevel error -i "$SRC" \
  -vf "eq=brightness=0.045:contrast=1.09:saturation=1.14:gamma=1.04,unsharp=5:5:0.4:5:5:0.0,fade=t=in:st=0:d=0.5,fade=t=out:st=42.4:d=0.6" \
  -af "afade=t=in:st=0:d=0.4,afade=t=out:st=42.4:d=0.6,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 22 -preset medium -movflags +faststart \
  -c:a aac -b:a 128k "$OUTDIR/review.mp4"
# Poster frame at 2.5s from the processed video
"$FF" -y -hide_banner -loglevel error -ss 2.5 -i "$OUTDIR/review.mp4" -frames:v 1 -q:v 3 "$OUTDIR/review-poster.jpg"
echo "VIDEO_DONE"
ls -la "$OUTDIR"
