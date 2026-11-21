"""Tile rendered stills into a labelled contact sheet: sheet.py <dir> <prefix> <cols> <out.jpg>"""
import glob, sys
from PIL import Image, ImageDraw
d, prefix, cols, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
files = sorted(glob.glob(f"{d}/{prefix}-*.jpg"))
ims = [Image.open(f) for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (w * cols, h * rows), "#000")
for i, (f, im) in enumerate(zip(files, ims)):
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    frame = int(f.rsplit("-", 1)[1].split(".")[0])
    ImageDraw.Draw(sheet).text(((i % cols) * w + 6, (i // cols) * h + 4), f"{frame/30:.2f}s", fill="#ffff00")
sheet.save(out, quality=86)
print(out, sheet.size)
