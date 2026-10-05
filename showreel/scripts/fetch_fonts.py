#!/usr/bin/env python3
"""Downloads the variable fonts used by the reel into public/fonts/ (self-hosted,
so renders never depend on the network) together with their OFL licences.

  Roboto Flex  — wght 100–1000, wdth 25–151, opsz 8–144   (kinetic type)
  Fraunces     — wght 100–900, opsz 9–144, SOFT, WONK      (expressive serif accents)
  Martian Mono — wght 100–800, wdth 75–112.5               (labels / HUD)

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
    "RobotoFlex": ("Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000", "robotoflex"),
    "Fraunces": ("Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1", "fraunces"),
    "MartianMono": ("Martian+Mono:wdth,wght@75..112.5,100..800", "martianmono"),
}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (query, ofl_dir) in FONTS.items():
        css = get(f"https://fonts.googleapis.com/css2?family={query}&display=block").decode()
        # Keep only the "latin" subset blocks (one per style).
        blocks = re.findall(r"/\* latin \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
        if not blocks:
            raise SystemExit(f"no latin block for {name}:\n{css[:400]}")
        for block in blocks:
            style = re.search(r"font-style:\s*(\w+)", block).group(1)
            url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
            dest = OUT / f"{name}{'-Italic' if style == 'italic' else ''}.woff2"
            dest.write_bytes(get(url))
            print(f"{dest.name}: {dest.stat().st_size // 1024} KB")
        lic = get(f"https://raw.githubusercontent.com/google/fonts/main/ofl/{ofl_dir}/OFL.txt")
        (OUT / f"{name}-OFL.txt").write_bytes(lic)


if __name__ == "__main__":
    main()
