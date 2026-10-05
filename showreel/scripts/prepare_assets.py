#!/usr/bin/env python3
"""Precomputes deterministic assets for the reel.

  src/data/particles.json  target points for the generative scene: the word
                           "MOTION" set in Roboto Flex (instanced at wght 900,
                           wdth 100) and sampled on a jittered grid.
  public/textures/grain.png  tileable film grain.

Usage: python3 scripts/prepare_assets.py   (needs numpy, pillow, fonttools, brotli)
"""
from __future__ import annotations

import io
import json
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
W, H = 1920, 1080
RNG = np.random.default_rng(128)


def particle_targets(word: str = "MOTION", step: int = 10) -> list[list[int]]:
    font = TTFont(ROOT / "public" / "fonts" / "RobotoFlex.woff2")
    font.flavor = None
    inst = instancer.instantiateVariableFont(font, {"wght": 900, "wdth": 100, "opsz": 144})
    buf = io.BytesIO()
    inst.save(buf)
    buf.seek(0)
    size = 420
    pil_font = ImageFont.truetype(buf, size)
    img = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(img)
    l, t, r, b = draw.textbbox((0, 0), word, font=pil_font)
    draw.text(((W - (r - l)) / 2 - l, (H - (b - t)) / 2 - t), word, font=pil_font, fill=255)
    mask = np.asarray(img) > 127
    pts = []
    for y in range(0, H, step):
        for x in range(0, W, step):
            jx, jy = RNG.uniform(-3.5, 3.5, 2)
            px, py = int(round(x + jx)), int(round(y + jy))
            if 0 <= px < W and 0 <= py < H and mask[py, px]:
                pts.append([px, py])
    RNG.shuffle(pts)
    return pts


def grain(size: int = 512) -> Image.Image:
    from scipy import ndimage

    n = RNG.normal(0.5, 0.2, (size, size))
    n = ndimage.gaussian_filter(n, 0.7, mode="wrap")
    n = (n - n.min()) / (n.max() - n.min())
    return Image.fromarray((n * 255).astype(np.uint8), "L")


def main() -> None:
    pts = particle_targets()
    (ROOT / "src" / "data").mkdir(parents=True, exist_ok=True)
    (ROOT / "src" / "data" / "particles.json").write_text(json.dumps({"word": "MOTION", "points": pts}, separators=(",", ":")))
    print(f"particles.json: {len(pts)} points")
    (ROOT / "public" / "textures").mkdir(parents=True, exist_ok=True)
    grain().save(ROOT / "public" / "textures" / "grain.png", optimize=True)
    print("grain.png written")


if __name__ == "__main__":
    main()
