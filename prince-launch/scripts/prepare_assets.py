#!/usr/bin/env python3
"""
Prepares the film's image assets from the originals in source/.

  source/prince-portrait.jpg  →  public/photo/prince-cutout.png
      Person cut out with MediaPipe's selfie segmenter (multiclass), edges refined
      with a guided filter, graded to a deep monochrome, cropped to head and
      shoulders, and faded out at the chest so the jacket's sponsor logos and the
      rink signage never read on screen.

  public/textures/grain.png   static film grain tile

  src/data/wordmark.json      "PRINCE GARG" sampled from Inter ExtraBold onto a dot
                              grid, for the Nothing-style dot-matrix logo in the CTA

Usage:  python3 scripts/prepare_assets.py --model /path/to/selfie_multiclass_256x256.tflite
        (model: https://storage.googleapis.com/mediapipe-models/image_segmenter/
                selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite)
Needs:  mediapipe, numpy, scipy, pillow, fonttools, brotli
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, uniform_filter

ROOT = Path(__file__).resolve().parents[1]


def segment(img: Image.Image, model: Path) -> np.ndarray:
    """Probability that each pixel belongs to the person (hair, skin, clothes)."""
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision

    opts = vision.ImageSegmenterOptions(
        base_options=mpt.BaseOptions(model_asset_path=str(model)),
        output_confidence_masks=True,
        output_category_mask=False,
    )
    with vision.ImageSegmenter.create_from_options(opts) as seg:
        res = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(img.convert("RGB"))))
    background = np.squeeze(res.confidence_masks[0].numpy_view()).astype(np.float32)
    return np.clip(1.0 - background, 0, 1)


def guided_filter(guide: np.ndarray, src: np.ndarray, r: int, eps: float) -> np.ndarray:
    """He et al. guided filter: snaps a soft mask to the edges of the photo."""
    size = 2 * r + 1
    mean_i = uniform_filter(guide, size)
    mean_p = uniform_filter(src, size)
    cov_ip = uniform_filter(guide * src, size) - mean_i * mean_p
    var_i = uniform_filter(guide * guide, size) - mean_i**2
    a = cov_ip / (var_i + eps)
    b = mean_p - a * mean_i
    return uniform_filter(a, size) * guide + uniform_filter(b, size)


def cutout(model: Path) -> None:
    src = Image.open(ROOT / "source" / "prince-portrait.jpg").convert("RGB")
    lum = np.asarray(src.convert("L"), dtype=np.float32) / 255.0
    prob = segment(src, model)
    prob = guided_filter(lum, prob, 6, 1e-3)
    alpha = np.clip((prob - 0.35) / 0.3, 0, 1)
    alpha = gaussian_filter(alpha, 0.6)

    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)

    # Paint out the sponsor text on the right shoulder: inside a soft ellipse, the
    # bright lettering is replaced by the dark fabric around it.
    th = np.deg2rad(32.5)  # the lettering runs diagonally down the sleeve
    u = (xx - 1020) * np.cos(th) + (yy - 1140) * np.sin(th)
    v = -(xx - 1020) * np.sin(th) + (yy - 1140) * np.cos(th)
    shoulder = np.exp(-(((u / 205) ** 2 + (v / 70) ** 2) ** 3))
    dark = np.percentile(lum[1060:1220, 900:1150], 30)
    fabric = gaussian_filter(np.minimum(lum, dark), 10)
    lum = lum * (1 - shoulder) + fabric * shoulder

    # Monochrome grade: crush the blacks, open up the backlit face, soft highlights.
    g = np.clip((lum - 0.03) / 0.88, 0, 1) ** 0.92
    face = np.exp(-(((xx - 640) / 230) ** 2 + ((yy - 900) / 260) ** 2))
    g = np.clip(g * (1 + 0.38 * face), 0, 1)
    g = g * 0.95 + 0.02

    # Head-and-shoulders crop, then fade out over the chest (jacket logos sit below).
    x0, x1, y0, y1 = 300, 1340, 560, 1500
    fade = np.clip((1310 - yy) / 260, 0, 1) ** 1.6
    a = (alpha * fade)[y0:y1, x0:x1]
    rgb = (g[y0:y1, x0:x1] * 255).astype(np.uint8)
    out = np.dstack([rgb, rgb, rgb, (a * 255).astype(np.uint8)])
    dest = ROOT / "public" / "photo" / "prince-cutout.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out, "RGBA").save(dest, optimize=True)
    print(f"{dest.relative_to(ROOT)}  {x1 - x0}x{y1 - y0}")


def grain() -> None:
    rng = np.random.default_rng(2026)
    n = gaussian_filter(rng.standard_normal((512, 512)), 0.7, mode="wrap")
    n = (n - n.min()) / (n.max() - n.min())
    dest = ROOT / "public" / "textures" / "grain.png"
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray((n * 255).astype(np.uint8), "L").save(dest, optimize=True)
    print(dest.relative_to(ROOT))


def wordmark(text: str = "PRINCE GARG", width: int = 1320, spacing: int = 13) -> None:
    """Dot-matrix wordmark: one dot per grid cell the glyphs mostly cover."""
    import io
    import json

    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from PIL import ImageDraw, ImageFont

    font = TTFont(ROOT / "public" / "fonts" / "Inter.woff2")
    font.flavor = None
    inst = instantiateVariableFont(font, {"wght": 800, "opsz": 32})
    buf = io.BytesIO()
    inst.save(buf)
    size = 400
    pil = ImageFont.truetype(io.BytesIO(buf.getvalue()), size)
    track = -0.03 * size
    widths = [pil.getlength(ch) for ch in text]
    total = sum(widths) + track * (len(text) - 1)
    canvas = Image.new("L", (int(total) + 40, int(size * 1.3)), 0)
    draw = ImageDraw.Draw(canvas)
    x = 20.0
    for ch, w in zip(text, widths):
        draw.text((x, 0), ch, font=pil, fill=255)
        x += w + track
    bbox = canvas.getbbox()
    canvas = canvas.crop(bbox)
    scale = width / canvas.width
    canvas = canvas.resize((width, round(canvas.height * scale)), Image.LANCZOS)
    a = np.asarray(canvas, dtype=np.float32) / 255.0
    h, w = a.shape
    pts = []
    for cy in range(spacing // 2, h, spacing):
        for cx in range(spacing // 2, w, spacing):
            cell = a[max(0, cy - spacing // 2) : cy + spacing // 2, max(0, cx - spacing // 2) : cx + spacing // 2]
            if cell.mean() > 0.5:
                pts.append([cx, cy])
    dest = ROOT / "src" / "data" / "wordmark.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps({"text": text, "width": w, "height": h, "spacing": spacing, "points": pts}) + "\n")
    print(f"{dest.relative_to(ROOT)}  {len(pts)} dots  {w}x{h}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", type=Path, required=True)
    args = ap.parse_args()
    cutout(args.model)
    grain()
    wordmark()
