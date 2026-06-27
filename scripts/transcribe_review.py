# Transcribe the review video with faster-whisper; write WebVTT + JSON segments.
import json, os
from faster_whisper import WhisperModel

SRC = r"C:/coding/aya-academy/web/public/videos/review.mp4"
if not os.path.exists(SRC):
    SRC = r"C:/coding/aya-academy/web/public/images/review.mp4"
OUTDIR = r"C:/coding/aya-academy/web/public/videos"

def ts(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

print("loading model...")
model = WhisperModel("small", device="cpu", compute_type="int8")
print("transcribing...")
segments, info = model.transcribe(SRC, beam_size=5, vad_filter=True)
lang = info.language
print("detected language:", lang, "prob", round(info.language_probability, 3))

segs = []
vtt = ["WEBVTT", ""]
for i, seg in enumerate(segments, 1):
    text = seg.text.strip()
    segs.append({"start": round(seg.start, 2), "end": round(seg.end, 2), "text": text})
    vtt.append(str(i))
    vtt.append(f"{ts(seg.start)} --> {ts(seg.end)}")
    vtt.append(text)
    vtt.append("")
    print(f"[{seg.start:6.2f}-{seg.end:6.2f}] {text}")

with open(os.path.join(OUTDIR, "review.vtt"), "w", encoding="utf-8") as f:
    f.write("\n".join(vtt))
with open(os.path.join(OUTDIR, "review.transcript.json"), "w", encoding="utf-8") as f:
    json.dump({"language": lang, "segments": segs, "text": " ".join(s["text"] for s in segs)}, f, ensure_ascii=False, indent=2)
print("TRANSCRIBE_DONE language=", lang, "segments=", len(segs))
