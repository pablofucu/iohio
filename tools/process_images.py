"""Prepara los logos subidos: quita fondo blanco (flood fill desde los bordes), recorta y exporta a webp."""
import sys, pathlib
from collections import deque
from PIL import Image
src = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2])
def unwhite(im, tol=32):
    im = im.convert("RGBA"); w, h = im.size; px = im.load()
    seen = bytearray(w * h); q = deque()
    def white(p): return p[3] > 0 and p[0] > 255 - tol and p[1] > 255 - tol and p[2] > 255 - tol
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft(); i = y * w + x
        if seen[i]: continue
        seen[i] = 1
        p = px[x, y]
        if p[3] == 0 or white(p):
            px[x, y] = (255, 255, 255, 0)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]: q.append((nx, ny))
    return im
def save(im, name, maxside):
    im = im.convert("RGBA"); im = im.crop(im.getbbox())
    im.thumbnail((maxside, maxside), Image.LANCZOS)
    im.save(out / name, "WEBP", quality=88, method=6); print(name, im.size, (out / name).stat().st_size)
save(Image.open(src / "1274fa50-image.png"), "radler.webp", 640)
save(unwhite(Image.open(src / "0b571b4a-image.jpg")), "monster.webp", 640)
save(Image.open(src / "8b30dd5b-image.webp"), "helldivers.webp", 600)
save(Image.open(src / "e96a109c-image.webp"), "smite.webp", 712)
save(unwhite(Image.open(src / "87980f02-image.png")), "mochila.webp", 480)
