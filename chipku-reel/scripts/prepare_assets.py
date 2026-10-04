#!/usr/bin/env python3
"""Prepares the visual assets for the Chipku reel.

1. Brand logos (from the two supplied files in brand/):
   - chipku-logo-full.png    : the supplied full logo already has transparency;
                               its near-opaque alpha (253/254 from lossy WebP) is
                               normalised to 255 and the canvas is trimmed.
   - chipku-logo-initial.png : the supplied "C" logo sits on white; the white
                               backdrop connected to the image border is removed
                               and the anti-aliased black outline is un-mixed
                               from white. Artwork pixels are not altered.
2. textures/grain.png : tileable paper grain used as a subtle print texture.
3. brand/palette.json : colours sampled from the logos.

Usage:  python3 scripts/prepare_assets.py
Requires: numpy, pillow, scipy  (pip install -r audio/requirements.txt)
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "brand"
PUBLIC = ROOT / "public"


def crop_to_alpha(rgba: np.ndarray, pad: int = 12, threshold: float = 8) -> np.ndarray:
    ys, xs = np.where(rgba[..., 3] > threshold)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, rgba.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, rgba.shape[1])
    return rgba[y0:y1, x0:x1]


def full_logo() -> Image.Image:
    im = np.asarray(Image.open(BRAND / "source-chipku-logo-full.webp").convert("RGBA")).astype(np.float32)
    alpha = im[..., 3]
    im[..., 3] = np.where(alpha >= 245, 255, alpha)
    return Image.fromarray(crop_to_alpha(im).round().astype(np.uint8), "RGBA")


def initial_logo() -> Image.Image:
    rgb = np.asarray(Image.open(BRAND / "source-chipku-logo-initial.webp").convert("RGB")).astype(np.float32)
    lo = rgb.min(-1)
    sat = rgb.max(-1) - lo
    whiteish = (lo > 200) & (sat < 30)
    labels, _ = ndimage.label(whiteish)
    edge_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, edge_labels[edge_labels > 0])
    # Anti-aliased band between the black outline and the white backdrop.
    band = ndimage.binary_dilation(background, iterations=3) & ~background & (sat < 40)
    alpha = np.ones(lo.shape, np.float32)
    alpha[background] = 0
    alpha[band] = np.clip(1 - rgb.mean(-1)[band] / 255.0, 0, 1)
    out = rgb.copy()
    out[band] = 0  # the outline is pure black; remove the white it was blended with
    rgba = np.dstack([out, alpha * 255])
    return Image.fromarray(crop_to_alpha(rgba).round().astype(np.uint8), "RGBA")


def palette() -> dict:
    """Median colours of the logo's yellow, orange and deep-orange bands."""
    px = np.asarray(Image.open(BRAND / "source-chipku-logo-initial.webp").convert("RGB")).reshape(-1, 3).astype(int)
    warm = px[(px[:, 0] > 180) & (px[:, 2] < 90)]

    def band(lo: int, hi: int) -> str:
        sel = warm[(warm[:, 1] >= lo) & (warm[:, 1] < hi)]
        r, g, b = np.median(sel, 0).astype(int)
        return f"#{r:02X}{g:02X}{b:02X}"

    return {
        "sampled": {"yellow": band(200, 256), "orange": band(140, 170), "deepOrange": band(110, 140)},
        "note": "Brand palette = logo yellow, orange, deep orange, black outline, plus off-white paper.",
    }


def grain(size: int = 512, seed: int = 7) -> Image.Image:
    rng = np.random.default_rng(seed)
    noise = rng.normal(0.5, 0.18, (size, size))
    noise = ndimage.gaussian_filter(noise, 0.6, mode="wrap")
    noise = (noise - noise.min()) / (noise.max() - noise.min())
    return Image.fromarray((noise * 255).astype(np.uint8), "L")


def main() -> None:
    (PUBLIC / "brand").mkdir(parents=True, exist_ok=True)
    (PUBLIC / "textures").mkdir(parents=True, exist_ok=True)
    for name, img in [("chipku-logo-full.png", full_logo()), ("chipku-logo-initial.png", initial_logo())]:
        img.save(BRAND / name, optimize=True)
        img.save(PUBLIC / "brand" / name, optimize=True)
        print(f"{name}: {img.size[0]}x{img.size[1]}")
    grain().save(PUBLIC / "textures" / "grain.png", optimize=True)
    (BRAND / "palette.json").write_text(json.dumps(palette(), indent=2) + "\n")
    print("palette:", palette()["sampled"])


if __name__ == "__main__":
    main()
