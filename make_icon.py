"""Generate a stock-chart app icon (icon.ico) for the desktop shortcut."""
from PIL import Image, ImageDraw

S = 256
# vertical gradient background (navy → deep blue)
grad = Image.new("RGB", (S, S))
gd = ImageDraw.Draw(grad)
top, bot = (31, 70, 130), (12, 22, 40)
for y in range(S):
    t = y / (S - 1)
    gd.line([(0, y), (S, y)], fill=(
        int(top[0] + (bot[0] - top[0]) * t),
        int(top[1] + (bot[1] - top[1]) * t),
        int(top[2] + (bot[2] - top[2]) * t),
    ))

# rounded-square mask
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([6, 6, S - 6, S - 6], radius=54, fill=255)
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
img.paste(grad, (0, 0), mask)

d = ImageDraw.Draw(img)
green = (43, 212, 106, 255)
pts = [(46, 198), (90, 150), (130, 172), (172, 112), (214, 60)]

# soft area fill under the line
base = 210
d.polygon(pts + [(pts[-1][0], base), (pts[0][0], base)], fill=(43, 212, 106, 60))
# the trend line
d.line(pts, fill=green, width=16, joint="curve")
# node dots
for p in pts:
    d.ellipse([p[0] - 8, p[1] - 8, p[0] + 8, p[1] + 8], fill=(255, 255, 255, 255))
# up arrow head at the end
ex, ey = pts[-1]
d.polygon([(ex + 24, ey - 22), (ex - 16, ey - 30), (ex + 16, ey + 10)], fill=green)

img.save("icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("icon.ico written")
