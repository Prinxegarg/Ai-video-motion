#!/usr/bin/env python3
"""Downloads the variable fonts used by the film into public/fonts/ (self-hosted,
so renders never depend on the network) together with their OFL licences.

  Inter         — wght 100–900, opsz 14–32   (display + body)
  Space Grotesk — wght 300–700               (labels, UI chrome, numbers)

Usage: python3 scripts/fetch_fonts.py
"""
from __future__ import annotations

import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "fonts"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"

FONTS = {
    "Inter": ("Inter:opsz,wght@14..32,100..900", "inter"),
    "SpaceGrotesk": ("Space+Grotesk:wght@300..700", "spacegrotesk"),
}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (query, ofl_dir) in FONTS.items():
        css = get(f"https://fonts.googleapis.com/css2?family={query}&display=block").decode()
        block = re.search(r"/\* latin \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
        if not block:
            raise SystemExit(f"no latin block for {name}:\n{css[:400]}")
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block.group(1)).group(1)
        dest = OUT / f"{name}.woff2"
        dest.write_bytes(get(url))
        print(f"{dest.name}: {dest.stat().st_size // 1024} KB")
        lic = get(f"https://raw.githubusercontent.com/google/fonts/main/ofl/{ofl_dir}/OFL.txt")
        (OUT / f"{name}-OFL.txt").write_bytes(lic)


if __name__ == "__main__":
    main()
