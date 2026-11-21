"""Contact sheet straight from rendered frames, to check motion between keyframes.
   strip.py <frames_dir> <first> <last> <step> <cols> <out.jpg> [scale]"""
import os, re, sys
from PIL import Image, ImageDraw
d, a, b, step, cols, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
scale = float(sys.argv[7]) if len(sys.argv) > 7 else 0.25
index = {}
for root, _, files in os.walk(d):          # includes the hidden .part-* folders of a render in progress
    for f in files:
        m = re.search(r"(\d+)\.jpe?g$", f)
        if m: index[int(m.group(1))] = os.path.join(root, f)
want = [n for n in range(a, b + 1, step) if n in index]
ims = [Image.open(index[n]) for n in want]
w, h = int(ims[0].width * scale), int(ims[0].height * scale)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (w * cols, h * rows), "#000")
for i, (n, im) in enumerate(zip(want, ims)):
    sheet.paste(im.resize((w, h), Image.LANCZOS), ((i % cols) * w, (i // cols) * h))
    ImageDraw.Draw(sheet).text(((i % cols) * w + 5, (i // cols) * h + 3), f"f{n} {n/30:.2f}s", fill="#ffff00")
sheet.save(out, quality=85)
print(out, sheet.size, f"{len(ims)} frames")
