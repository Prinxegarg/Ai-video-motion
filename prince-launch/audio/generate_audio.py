#!/usr/bin/env python3
"""
Original soundtrack + sound design for the Prince Garg launch film, synthesised
from scratch with numpy/scipy (no samples, no loops, no third-party audio).

It reads src/timeline.json, the cue sheet the film is built on (times in seconds),
so every hit, whoosh, click and riser lands on the frame its animation does.

The track is 120 BPM in D minor. One beat is 0.5 s, so every scene change in
the brief (3, 7, 11, 15, 19 and 23 s) falls exactly on a bar downbeat.

  0–3 s    atmosphere: pad swell, digital texture, counter ticks, riser
  3 s      the drop: impact, four-on-the-floor, rolling bass
  7–15 s   groove with sharp percussion and a pluck arp
  15–23 s  lift: 16th arp, open hats, extra percussion, snare fill
  23–26 s  tension: drums out, three slams, riser, a 1/8 of silence
  26–30 s  final hit, last chord, clean fade to digital silence

Writes
  public/audio/soundtrack.wav   48 kHz / 16-bit stereo, exactly 30.000 s,
                                about -14 LUFS with true peak below -1 dBTP
  out/stems/*.wav               drums / bass / music / sfx, only with --stems

Usage:  python3 audio/generate_audio.py [--stems]
Needs:  numpy, scipy, pyloudnorm
"""

from __future__ import annotations

import json
import pathlib
import sys

import numpy as np
import pyloudnorm as pyln
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d

ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())

SR = 48_000
BPM = TL["bpm"]
FPS = TL["fps"]
BEAT = 60 / BPM  # seconds per beat (0.5)
N = int(round(TL["durationInFrames"] / FPS * SR))  # 1 440 000 = exactly 30.000 s
TARGET_LUFS = -14.0
CEILING_DBTP = -1.2

rng = np.random.default_rng(20261011)


# ── basics ────────────────────────────────────────────────────────────────────


def at(seconds: float) -> int:
    """Sample index of a time in seconds."""
    return int(round(seconds * SR))


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def gain(db: float) -> float:
    return 10 ** (db / 20)


def tt(n: int) -> np.ndarray:
    return np.arange(n) / SR


def ns(seconds: float) -> int:
    return int(round(seconds * SR))


def noise(n: int) -> np.ndarray:
    return rng.standard_normal(n)


def edge_fade(x: np.ndarray, fin: float = 0.001, fout: float = 0.008) -> np.ndarray:
    """Short fades so nothing clicks."""
    x = x.copy()
    a, b = min(len(x), ns(fin)), min(len(x), ns(fout))
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None] if x.ndim == 2 else np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None] if x.ndim == 2 else np.linspace(1, 0, b)
    return x


def decay(n: int, tau: float, attack: float = 0.001) -> np.ndarray:
    """Linear attack, exponential decay (time constant tau)."""
    t = tt(n)
    e = np.exp(-np.maximum(0.0, t - attack) / tau)
    a = t < attack
    e[a] = t[a] / attack
    return e


# ── oscillators ───────────────────────────────────────────────────────────────

_tables: dict[tuple[str, int], np.ndarray] = {}


def _table(kind: str, harmonics: int) -> np.ndarray:
    key = (kind, harmonics)
    if key not in _tables:
        x = np.arange(4096) / 4096
        y = np.zeros(4096)
        for k in range(1, harmonics + 1):
            if kind == "saw":
                y += np.sin(2 * np.pi * k * x) / k
            elif kind == "square" and k % 2:
                y += np.sin(2 * np.pi * k * x) / k
        _tables[key] = y / np.max(np.abs(y))
    return _tables[key]


def osc(freq, n: int, kind: str = "sine", phase: float | None = None) -> np.ndarray:
    """Band-limited oscillator. freq may be a scalar or a per-sample array (glides)."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    ph0 = rng.random() if phase is None else phase
    ph = (np.cumsum(f) / SR + ph0) % 1.0
    if kind == "sine":
        return np.sin(2 * np.pi * ph)
    harmonics = max(1, int(min(15_000.0, SR * 0.45) / max(20.0, float(np.max(f)))))
    tab = _table(kind, min(harmonics, 400))
    idx = ph * 4096
    i0 = idx.astype(int) % 4096
    frac = idx - np.floor(idx)
    return tab[i0] * (1 - frac) + tab[(i0 + 1) % 4096] * frac


# ── filters ───────────────────────────────────────────────────────────────────


def butter(x: np.ndarray, kind: str, fc, order: int = 2) -> np.ndarray:
    fc = np.clip(np.asarray(fc, dtype=float), 20, SR * 0.45)
    sos = signal.butter(order, fc, {"low": "lowpass", "high": "highpass", "band": "bandpass"}[kind], fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def _biquad(kind: str, fc: float, q: float):
    w0 = 2 * np.pi * min(max(fc, 20.0), SR * 0.45) / SR
    c, s = np.cos(w0), np.sin(w0)
    alpha = s / (2 * q)
    if kind == "low":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == "high":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:  # band, 0 dB peak
        b = [alpha, 0.0, -alpha]
    a = [1 + alpha, -2 * c, 1 - alpha]
    return np.array(b) / a[0], np.array(a) / a[0]


def sweep(x: np.ndarray, fc, kind: str = "low", q: float = 0.8, block: int = 64) -> np.ndarray:
    """Time-varying resonant filter: fc is a per-sample cutoff curve (mono input)."""
    n = len(x)
    fc = np.broadcast_to(np.asarray(fc, dtype=float), (n,))
    out = np.empty(n)
    zi = np.zeros(2)
    for s in range(0, n, block):
        e = min(n, s + block)
        b, a = _biquad(kind, float(fc[(s + e) // 2]), q)
        out[s:e], zi = signal.lfilter(b, a, x[s:e], zi=zi)
    return out


# ── buses ─────────────────────────────────────────────────────────────────────


class Bus:
    def __init__(self, name: str):
        self.name = name
        self.x = np.zeros((N, 2))

    def add(self, sig: np.ndarray, start: int, db: float = 0.0, pan: float = 0.0, width: float = 0.0):
        """Mix a mono (panned, optionally widened) or stereo signal in at sample `start`."""
        if sig.ndim == 1:
            a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
            st = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1) * np.sqrt(2)
            if width > 0:  # Haas-style decorrelation on the right channel
                d = ns(0.011)
                st[:, 1] = (1 - width) * st[:, 1] + width * np.concatenate([np.zeros(d), st[:-d, 1]])
            sig = st
        s0 = max(0, start)
        e0 = min(N, start + len(sig))
        if e0 > s0:
            self.x[s0:e0] += sig[s0 - start : e0 - start] * gain(db)


def make_ir(rt60: float = 1.9, length: float = 2.8, predelay: float = 0.018) -> np.ndarray:
    """Stereo plate-ish impulse response: decorrelated noise, darkening as it decays."""
    n = ns(length)
    t = tt(n)
    env = np.exp(-6.91 * t / rt60)[:, None]
    raw = rng.standard_normal((n, 2)) * env
    bright = butter(raw, "low", 9000, 1)
    dark = butter(raw, "low", 2200, 2)
    w = np.clip(t / (length * 0.55), 0, 1)[:, None]
    ir = bright * (1 - w) + dark * w
    ir[: ns(predelay)] = 0
    for ms, g in [(19, 0.55), (27, -0.45), (41, 0.35), (53, -0.3), (67, 0.22)]:
        i = ns(ms / 1000)
        ir[i, 0] += g
        ir[i + ns(0.0017), 1] -= g
    ir[: ns(predelay) - 1] = 0
    return ir / np.sqrt(np.sum(ir**2, axis=0, keepdims=True))


def reverb(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], axis=1)


# ── instruments ───────────────────────────────────────────────────────────────


def kick() -> np.ndarray:
    n = ns(0.45)
    t = tt(n)
    f = 46 + 130 * np.exp(-t / 0.03)
    body = osc(f, n, phase=0.25) * decay(n, 0.17, 0.0005)
    click = butter(noise(n) * decay(n, 0.0025, 0.0001), "high", 1800) * 0.4
    k = np.tanh((body + click) * 1.8) / np.tanh(1.8)
    return edge_fade(k, 0.0003, 0.03)


def clap() -> np.ndarray:
    n = ns(0.32)
    t = tt(n)
    env = np.zeros(n)
    for off, g in [(0.0, 0.75), (0.008, 0.85), (0.017, 1.0)]:
        o = ns(off)
        env[o:] = np.maximum(env[o:], g * np.exp(-tt(n - o) / 0.0055))
    tail = np.where(t > 0.017, np.exp(-(t - 0.017) / 0.085), 0) * 0.55
    env = np.maximum(env, tail)
    return butter(noise(n), "band", [850, 4200], 2) * env * 1.6


def hat(open_: bool = False) -> np.ndarray:
    n = ns(0.32 if open_ else 0.07)
    metal = sum(osc(f, n, "square") for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0)) / 6
    x = butter(metal * 0.6 + noise(n) * 0.5, "band", [6500, 15000], 2)
    return x * decay(n, 0.075 if open_ else 0.016, 0.0005) * 2.2


def snare(tone: float = 190.0, tau: float = 0.07) -> np.ndarray:
    n = ns(0.25)
    t = tt(n)
    body = osc(tone * (1 + 0.6 * np.exp(-t / 0.008)), n, phase=0.0) * decay(n, 0.04)
    rattle = butter(noise(n), "band", [1500, 9500], 2) * decay(n, tau)
    return body * 0.55 + rattle * 1.1


def bass_note(midi: float, dur: float, peak: float = 1500.0, q: float = 1.4) -> np.ndarray:
    n = ns(dur)
    t = tt(n)
    f = hz(midi)
    x = osc(f, n, "saw") * 0.55 + osc(f * 1.006, n, "saw") * 0.35 + osc(f, n, "square") * 0.25
    x = sweep(x, 140 + peak * np.exp(-t / 0.055), "low", q)
    sub = osc(f, n, phase=0.0) * 0.55
    env = decay(n, 0.5, 0.003)
    return edge_fade((x + sub) * env, 0.001, 0.012)


def pad(notes: list[int], dur: float, cutoff: float) -> np.ndarray:
    n = ns(dur)
    out = np.zeros((n, 2))
    for m in notes:
        for detune, pan in ((-0.09, -0.75), (0.0, 0.0), (0.085, 0.75)):
            v = osc(hz(m + detune), n, "saw")
            a = (pan + 1) * np.pi / 4
            out[:, 0] += v * np.cos(a)
            out[:, 1] += v * np.sin(a)
    out = butter(out, "low", cutoff, 2)
    env = np.minimum(1.0, tt(n) / 0.12) * np.minimum(1.0, (n - np.arange(n)) / ns(0.35))
    return out * env[:, None] / (len(notes) * 2.2)


# ── sound design (one function per cue type in timeline.json) ─────────────────


def sfx_blip(note=84, **_):
    n = ns(0.16)
    x = osc(hz(note), n, phase=0) + 0.25 * osc(hz(note) * 2, n, phase=0)
    return x * decay(n, 0.045, 0.001)


def sfx_zip(**_):
    n = ns(0.2)
    t = tt(n)
    f = 380 * (14 ** (np.minimum(1, t / 0.16) ** 1.4))
    x = osc(f, n, "saw") * 0.35 + sweep(noise(n), f * 1.5, "band", 2.5) * 0.9
    return x * np.sin(np.pi * np.minimum(1, t / 0.2)) ** 0.7


def sfx_leader(**_):
    n = ns(0.12)
    x = osc(1000, n, phase=0) + 0.12 * osc(3000, n, phase=0)
    return edge_fade(x, 0.003, 0.012)


def sfx_suck(t: float, peakAt: float, **_):
    """Reverse swell that peaks exactly on peakAt, then stops dead."""
    n = at(peakAt) - at(t)
    t = np.linspace(0, 1, n)
    rise = t**2.6
    hiss = sweep(noise(n), 250 * (40 ** t), "band", 1.2) * 1.4
    tone = osc(70 * (6 ** t), n, "saw") * 0.18
    x = (hiss + tone) * rise
    x[-ns(0.004) :] *= np.linspace(1, 0, ns(0.004))
    return x


def sfx_impact(**_):
    n = ns(2.4)
    t = tt(n)
    sub = osc(31 + 75 * np.exp(-t / 0.07), n, phase=0.25) * decay(n, 0.7, 0.0005)
    tom = osc(95 + 160 * np.exp(-t / 0.02), n, phase=0.25) * decay(n, 0.2)
    crack = butter(noise(n), "high", 900) * decay(n, 0.045, 0.0003)
    thud = butter(noise(n), "low", 1300) * decay(n, 0.32)
    x = sub * 1.1 + tom * 0.6 + crack * 0.8 + thud * 0.5
    return np.tanh(x * 1.6) / np.tanh(1.6)


def sfx_stretch(**_):
    """Rubber-band glide for the variable-font squeeze (down, then snap back up)."""
    n = ns(0.62)
    t = tt(n)
    down = np.clip(t / 0.36, 0, 1)
    up = np.clip((t - 0.36) / 0.2, 0, 1)
    f = 260 * (0.42 ** (down**2)) * (2.9 ** (up**0.7))
    vib = 1 + 0.025 * np.sin(2 * np.pi * 9 * t)
    x = osc(f * vib, n, "saw")
    x = sweep(x, 300 + 2200 * np.sin(np.pi * np.clip(t / 0.62, 0, 1)), "band", 3.0)
    return x * np.sin(np.pi * np.clip(t / 0.62, 0, 1)) ** 0.5 * 2.2


def sfx_stamp(note=65, **_):
    n = ns(0.3)
    t = tt(n)
    f = hz(note)
    x = osc(f, n, "saw") + osc(f * 2, n, "saw") * 0.6 + osc(f * 1.005, n, "square") * 0.4
    x = sweep(x, 500 + 6500 * np.exp(-t / 0.035), "low", 2.2)
    return x * decay(n, 0.09, 0.001)


def sfx_burst(**_):
    n = ns(0.8)
    t = tt(n)
    body = sweep(noise(n), 300 + 7000 * np.exp(-t / 0.12), "low", 0.9) * decay(n, 0.14, 0.0005)
    grains = np.zeros(n)
    for _ in range(60):
        i = int(rng.random() ** 1.8 * n * 0.85)
        g = butter(noise(ns(0.006)), "high", 3000) * rng.uniform(0.2, 1.0) * np.exp(-i / (0.25 * SR))
        grains[i : i + len(g)] += g[: n - i]
    thump = osc(60 + 90 * np.exp(-t / 0.02), n, phase=0.25) * decay(n, 0.09)
    return body * 1.2 + grains * 0.9 + thump * 0.7


def sfx_glitch(**_):
    """Bit-crushed stutter: 64th-note slices of tone and noise."""
    slice_n = ns(BEAT / 4)
    parts = []
    for i in range(4):
        f = hz(rng.choice([77, 84, 89, 96, 72]))
        src = osc(f, slice_n, "square") if i % 2 == 0 else noise(slice_n) * 0.6
        hold = 6 + 6 * (i % 3)  # sample-rate reduction
        src = np.repeat(src[::hold], hold)[:slice_n]
        src = np.round(src * 6) / 6  # ~3-bit
        parts.append(edge_fade(src, 0.0005, 0.002) * (1 - i * 0.12))
    return np.concatenate(parts) * 0.8


def sfx_hit(**_):
    n = ns(0.7)
    t = tt(n)
    thump = osc(52 + 150 * np.exp(-t / 0.018), n, phase=0.25) * decay(n, 0.13, 0.0005)
    snap = butter(noise(n), "high", 2200) * decay(n, 0.012, 0.0002)
    air = butter(noise(n), "band", [3000, 12000], 2) * decay(n, 0.14) * 0.3
    return np.tanh((thump + snap * 0.7 + air) * 1.4)


def sfx_swish(**_):
    n = ns(0.42)
    t = np.linspace(0, 1, n)
    fc = 600 * (9 ** np.sin(np.pi * t * 0.85))
    x = sweep(noise(n), fc, "band", 1.6) * np.sin(np.pi * t) ** 1.6
    return x * 2.0


def sfx_pluck(note=77, **_):
    n = ns(0.6)
    t = tt(n)
    f = hz(note)
    x = osc(f, n, "square") * 0.45 + osc(f * 2.004, n, "saw") * 0.25 + osc(f, n) * 0.5
    x = sweep(x, 450 + 7500 * np.exp(-t / 0.045), "low", 1.6)
    return x * decay(n, 0.17, 0.001)


def sfx_rumble(**_):
    n = ns(1.2)
    t = tt(n)
    x = butter(noise(n), "low", 140, 2) * 2.5 + osc(38, n) * 0.6
    return np.tanh(x * np.minimum(1, t / 0.08) * np.exp(-t / 0.45) * 1.5)


def sfx_shimmer(**_):
    n = ns(1.3)
    t = tt(n)
    out = np.zeros((n, 2))
    for m in (89, 92, 96, 99, 101, 104, 108):
        v = osc(hz(m) * (1 + rng.uniform(-0.002, 0.002)), n)
        trem = 0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(6, 13) * t + rng.uniform(0, 6))
        a = (rng.uniform(-0.9, 0.9) + 1) * np.pi / 4
        env = np.minimum(1, t / 0.08) * np.exp(-t / 0.4)
        out[:, 0] += v * trem * env * np.cos(a)
        out[:, 1] += v * trem * env * np.sin(a)
    return out / 3.0


def sfx_chime(note=84, **_):
    n = ns(2.2)
    t = tt(n)
    f = hz(note)
    index = 2.4 * np.exp(-t / 0.35)
    x = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * 3.5 * t))
    x += 0.35 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.25)
    x += 0.2 * np.sin(2 * np.pi * f * 0.5 * t)
    return x * decay(n, 0.65, 0.002)


def sfx_bloop(note=60, **_):
    """Water droplet: a fast upward sine chirp."""
    n = ns(0.24)
    t = tt(n)
    f = hz(note) * (0.5 + 1.25 * (1 - np.exp(-t / 0.028)))
    x = osc(f, n, phase=0)
    x += 0.3 * osc(f * 2, n, phase=0) * np.exp(-t / 0.02)
    return x * decay(n, 0.055, 0.002)


def sfx_data(**_):
    """Computer chatter: square blips on 32nd notes, D minor pentatonic."""
    step = ns(BEAT / 8)
    count = 14
    out = np.zeros(step * count + ns(0.05))
    scale = [74, 77, 79, 81, 84, 86, 89, 91, 93]
    for i in range(count):
        m = rng.choice(scale)
        n = ns(0.03)
        b = osc(hz(m), n, "square") * decay(n, 0.012, 0.0005) * (1 - i / (count * 1.4))
        out[i * step : i * step + n] += b
    return out


def sfx_zoomOut(**_):
    n = ns(0.95)
    t = np.linspace(0, 1, n)
    fc = 5500 * (0.06 ** t)
    whoosh = sweep(noise(n), fc, "band", 1.3) * (np.minimum(1, t / 0.06) * np.exp(-t * 2.2)) * 2.4
    fall = osc(1100 * (0.15 ** t), n, "saw") * 0.12 * np.exp(-t * 3)
    return whoosh + sweep(fall, 3000, "low", 0.7)


def sfx_tick(note=89, **_):
    n = ns(0.09)
    x = osc(hz(note), n, phase=0) * decay(n, 0.02, 0.0005)
    x[: ns(0.001)] += noise(ns(0.001)) * 0.6
    return x



# ── launch-specific sound design ──────────────────────────────────────────────


def sfx_boot(**_):
    """Power-on: a rising digital chirp and a click."""
    n = ns(0.3)
    t = tt(n)
    f = 220 * (10 ** np.minimum(1, t / 0.16))
    x = osc(f, n, phase=0) * decay(n, 0.09, 0.002) * 0.7
    x[: ns(0.002)] += noise(ns(0.002)) * 0.5
    return x


def sfx_count(t: float, until: float, **_):
    """The counter: ticks that start dense and brake, pitch climbing."""
    total = until - t
    out = np.zeros(ns(total + 0.05))
    u = 0.0
    k = 0
    while u < total:
        p = u / total
        n = ns(0.012)
        f = hz(84 + 12 * p)
        b = osc(f, n, "square") * decay(n, 0.004, 0.0002) * (0.55 + 0.45 * p)
        i = ns(u)
        out[i : i + n] += b[: len(out) - i]
        u += 1 / lerp(46, 11, p**1.5)
        k += 1
    return out


def lerp(a: float, b: float, p: float) -> float:
    return a + (b - a) * p


def sfx_thump(**_):
    """Sub drop for the 100K+ landing."""
    n = ns(0.9)
    t = tt(n)
    sub = osc(38 + 70 * np.exp(-t / 0.06), n, phase=0.25) * decay(n, 0.32, 0.0005)
    click = butter(noise(n), "high", 2500) * decay(n, 0.006, 0.0002) * 0.5
    return np.tanh((sub + click) * 1.5)


def sfx_ui(**_):
    """Soft two-tone interface blip."""
    a, b = ns(0.05), ns(0.09)
    x = np.zeros(ns(0.16))
    x[:a] += osc(hz(88), a, phase=0) * decay(a, 0.015, 0.001)
    x[ns(0.045) : ns(0.045) + b] += osc(hz(95), b, phase=0) * decay(b, 0.025, 0.001)
    return x * 0.8


def sfx_whoosh(t: float, peakAt: float, **_):
    """Air whoosh that peaks on peakAt (the cut), then a short tail."""
    pre = at(peakAt) - at(t)
    n = pre + ns(0.28)
    u = np.arange(n) / pre
    env = np.where(u < 1, u**2.2, np.exp(-(u - 1) * pre / ns(0.07)))
    fc = np.where(u < 1, 350 * (16 ** u), 5600 * np.exp(-(u - 1) * pre / ns(0.12)))
    return sweep(noise(n), fc, "band", 1.1) * env * 2.2


def sfx_stab(note=62, **_):
    """Minor-chord synth stab for the identity words."""
    n = ns(0.45)
    t = tt(n)
    f = hz(note)
    x = sum(osc(f * r, n, "saw") for r in (1, 1.2, 1.5, 2.0)) / 3
    x = sweep(x, 400 + 7000 * np.exp(-t / 0.05), "low", 2.0)
    return x * decay(n, 0.13, 0.001)


def sfx_pop(note=81, **_):
    """UI pop: a quick upward chirp."""
    n = ns(0.09)
    t = tt(n)
    f = hz(note) * (0.6 + 0.9 * (1 - np.exp(-t / 0.012)))
    return osc(f, n, phase=0) * decay(n, 0.025, 0.001)


def sfx_typing(t: float, until: float, **_):
    """Key clicks, slightly irregular, about 20 per second."""
    total = until - t
    out = np.zeros(ns(total + 0.05))
    u = 0.0
    while u < total:
        n = ns(0.008)
        click = butter(noise(n), "band", [1800, 7000], 2) * decay(n, 0.0018, 0.0001)
        click += osc(rng.uniform(2600, 3400), n, phase=0) * decay(n, 0.002, 0.0001) * 0.3
        i = ns(u)
        out[i : i + n] += click * rng.uniform(0.6, 1.0)
        u += rng.uniform(0.035, 0.065)
    return out


def sfx_slap(**_):
    """Sticker slap: a flat smack, a low thud and a papery flap."""
    n = ns(0.5)
    t = tt(n)
    smack = butter(noise(n), "band", [700, 6500], 2) * decay(n, 0.012, 0.0002) * 1.6
    thud = osc(60 + 70 * np.exp(-t / 0.02), n, phase=0.25) * decay(n, 0.09, 0.0005)
    flap = np.zeros(n)
    k = ns(0.018)
    m = ns(0.03)
    flap[k : k + m] = butter(noise(m), "band", [2500, 9000], 2) * decay(m, 0.006, 0.0002) * 0.6
    return np.tanh(smack + thud + flap)


def sfx_card(**_):
    """Card flip: a short airy swish and a soft click as it settles."""
    n = ns(0.3)
    u = np.linspace(0, 1, n)
    swish = sweep(noise(n), 900 * (6 ** u), "band", 1.4) * np.sin(np.pi * np.minimum(1, u / 0.6)) ** 2 * 1.4
    swish[u > 0.6] = 0
    click = np.zeros(n)
    c = ns(0.012)
    i = int(n * 0.55)
    click[i : i + c] = osc(hz(91), c, phase=0) * decay(c, 0.004, 0.0002) * 0.6
    return swish + click


def sfx_slam(note=50, **_):
    """Vision slams: sub boom, crack and a dark chord stab."""
    n = ns(0.8)
    t = tt(n)
    sub = osc(36 + 80 * np.exp(-t / 0.05), n, phase=0.25) * decay(n, 0.28, 0.0005)
    crack = butter(noise(n), "high", 1200) * decay(n, 0.03, 0.0002)
    stab = sum(osc(hz(note + i), n, "saw") for i in (0, 12, 15, 19)) / 3
    stab = sweep(stab, 300 + 4000 * np.exp(-t / 0.06), "low", 1.6) * decay(n, 0.18, 0.001)
    return np.tanh((sub * 1.1 + crack * 0.7 + stab * 0.6) * 1.3)


SFX = {k[4:]: v for k, v in globals().items() if k.startswith("sfx_")}

# Cues that also feed the reverb (send level in dB relative to the cue).
SEND = {"impact": -8, "chime": -6, "stab": -9, "shimmer": -6, "pop": -14, "ui": -14, "slam": -7, "hit": -15, "thump": -16, "boot": -12}
PAN = {"tick": 0.25, "data": 0.3, "pop": -0.2, "typing": 0.15, "ui": 0.1}
WIDE = {"whoosh", "shimmer", "suck", "card", "data"}


# ── arrangement ───────────────────────────────────────────────────────────────

# D minor. One chord per 2-second bar from the drop; the tension bar splits iv → V.
CHORDS = [
    (0.0, "Dm", [50, 53, 57, 60], 38),
    (3.0, "Dm", [50, 53, 57, 60], 38),
    (5.0, "Bb", [50, 53, 58, 62], 34),
    (7.0, "F", [48, 53, 57, 60], 41),
    (9.0, "C", [48, 52, 55, 60], 36),
    (11.0, "Dm", [50, 53, 57, 60], 38),
    (13.0, "Bb", [50, 53, 58, 62], 34),
    (15.0, "F", [48, 53, 57, 60], 41),
    (17.0, "C", [48, 52, 55, 60], 36),
    (19.0, "Dm", [50, 53, 57, 60], 38),
    (21.0, "Bb", [50, 53, 58, 62], 34),
    (23.0, "Gm", [50, 55, 58, 62], 43),
    (25.0, "A", [49, 52, 57, 61], 45),
    (26.0, "Dm(add9)", [50, 53, 57, 64], 38),
]
GROOVE = (3.0, 23.0)  # drums + rolling bass
LIFT = 15.0  # second half of the montage: more energy
GAP = (25.875, 26.0)  # an 8th of silence before the final hit
END_FADE = (29.25, 29.9)  # everything is digital silence after this


def chord_at(t: float):
    cur = CHORDS[0]
    for c in CHORDS:
        if t >= c[0] - 1e-9:
            cur = c
    return cur


def grid(a: float, b: float, step: float) -> np.ndarray:
    return np.round(np.arange(a, b - 1e-9, step), 6)


def build() -> dict[str, np.ndarray]:
    drums, bass, music, sfx, send = Bus("drums"), Bus("bass"), Bus("music"), Bus("sfx"), Bus("send")

    # Drums: four-on-the-floor, claps on 2 & 4, 16th hats, open hats on the off-beat.
    kicks = [at(t) for t in grid(*GROOVE, BEAT)]
    for k in kicks:
        drums.add(kick(), k, -3.5)
    for t in grid(GROOVE[0] + BEAT, GROOVE[1], 2 * BEAT):
        c = clap()
        drums.add(c, at(t), -8.5 if t < LIFT else -7.5, width=0.4)
        send.add(c, at(t), -17)
        if t >= LIFT:
            drums.add(snare(200, 0.06), at(t), -16)
    for t in grid(*GROOVE, BEAT / 4):
        pos = int(round((t - GROOVE[0]) / (BEAT / 4))) % 4
        if pos == 2:
            drums.add(hat(True), at(t), (-17 if t < LIFT else -15) + rng.uniform(-0.8, 0.8), pan=0.2)
        else:
            drums.add(hat(False), at(t), (-23 if pos == 0 else -20) + rng.uniform(-1.2, 1.2), pan=-0.25)
    # "Sharp percussion" from 7 s: rim clicks on syncopated 16ths.
    for t in grid(7.0, GROOVE[1], 2.0):
        for off in (0.375, 0.875, 1.625):
            n = ns(0.04)
            rim = osc(hz(79), n, "square") * decay(n, 0.008, 0.0002) + butter(noise(n), "high", 3000) * decay(n, 0.006) * 0.5
            drums.add(rim, at(t + off), -19, pan=0.35)
    # Fill into the tension: 16th snares rising.
    for j, t in enumerate(grid(22.0, 23.0, BEAT / 4)):
        sn = snare(190 + 14 * j, 0.05)
        drums.add(sn, at(t), -21 + 0.9 * j, pan=0.1 * (-1) ** j)
        send.add(sn, at(t), -26 + j * 0.6)

    # Intro (0–3 s): digital texture and a riser into the drop.
    for j, t in enumerate(grid(0.6, 2.9, BEAT / 4)):
        n = ns(0.05)
        m = [86, 89, 93, 96, 98][j % 5]
        b = osc(hz(m), n, "square") * decay(n, 0.012, 0.0005)
        music.add(sweep(b, 3500, "low", 0.7), at(t), -30 + j * 0.25, pan=0.5 * np.sin(j))
    rn = at(2.92) - at(1.4)
    ru = np.linspace(0, 1, rn)
    riser = sweep(noise(rn), 300 * (20 ** ru), "band", 0.9) * ru**2
    riser += osc(hz(50) * (2 ** (ru * 2)), rn, "saw") * ru**2 * 0.14
    music.add(edge_fade(riser, 0.01, 0.006), at(1.4), -15, width=0.7)

    # Rolling bass: the 16ths after each kick, octave hop on the third.
    vel = {1: 0.8, 2: 1.0, 3: 0.85}
    for t in grid(*GROOVE, BEAT / 4):
        pos = int(round((t - GROOVE[0]) / (BEAT / 4))) % 4
        if pos == 0:
            continue
        root = chord_at(t)[3]
        note = root + (12 if pos == 2 else 0)
        peak = 1500.0 if t < LIFT else 2300.0
        bass.add(bass_note(note, BEAT / 4 * 0.92, peak), at(t), -7 + 20 * np.log10(vel[pos]))
    # Tension: a filtered pedal on the dominant, cut at the gap.
    pn = at(GAP[0]) - at(23.0)
    pu = np.linspace(0, 1, pn)
    pedal = osc(hz(31), pn, "saw") * 0.5 + osc(hz(31), pn) * 0.7
    pedal = sweep(pedal, 140 + 1600 * pu**2, "low", 2.0)
    bass.add(edge_fade(pedal, 0.01, 0.004), at(23.0), -12)
    # Final: D sub under the last hit.
    fn = ns(3.6)
    ft = tt(fn)
    bass.add(osc(hz(26), fn, phase=0.25) * np.exp(-ft / 0.9) + osc(hz(38), fn) * 0.4 * np.exp(-ft / 0.7), at(26.0), -7)

    # Pluck arp: 8ths through the groove, 16ths and an octave up after the lift.
    for t in grid(7.0, 23.0, BEAT / 2):
        if t >= LIFT:
            continue
        notes = chord_at(t)[2]
        k = int(round((t - 7.0) / (BEAT / 2)))
        m = notes[[0, 1, 2, 3, 2, 1][k % 6]] + 12
        p = sfx_pluck(note=m)
        music.add(p, at(t), -21, pan=0.3 * np.sin(k))
        send.add(p, at(t), -27)
    for t in grid(LIFT, 23.0, BEAT / 4):
        notes = chord_at(t)[2]
        k = int(round((t - LIFT) / (BEAT / 4)))
        m = notes[[0, 2, 1, 3, 2, 3, 1, 2][k % 8]] + 24
        p = sfx_pluck(note=m)
        music.add(p, at(t), -24 + (2 if k % 4 == 0 else 0), pan=0.4 * np.sin(k * 0.7))
        send.add(p, at(t), -29)

    # Pads: one chord per bar, filter opening through the film, pumped by the kick.
    for i, (t0, _, notes, _) in enumerate(CHORDS):
        if i == 0:
            continue  # the intro pad is the first CHORDS entry's swell, below
        t1 = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else 30.0
        dur = t1 - t0 + 0.35
        if t0 < LIFT:
            cutoff, db = 1300 + 120 * (t0 - 3), -6
        elif t0 < 23:
            cutoff, db = 2600, -5
        elif t0 < 26:
            cutoff, db = 1800 + 600 * (t0 - 23), -4
        else:
            cutoff, db, dur = 3000, -3, 3.9
        x = pad(notes, dur, cutoff)
        if t0 == 25.0:
            x = edge_fade(x[: at(GAP[0]) - at(25.0)], 0.001, 0.004)
        if t0 >= 26.0:
            x *= np.exp(-tt(len(x)) / 1.2)[:, None]
        music.add(x, at(t0), db)
        send.add(x, at(t0), db - 6)
    intro = pad(CHORDS[0][2], 3.4, 800)
    intro *= np.linspace(0, 1, len(intro))[:, None] ** 1.4
    music.add(intro, 0, -2)
    send.add(intro, 0, -8)

    # Finale heartbeat: kick + chord stabs on 27 and 28, the last beat on 29.
    for t, db in ((27.0, -9.0), (28.0, -9.0), (29.0, -4.0)):
        drums.add(kick(), at(t), db)
        st = sfx_stab(note=62)
        music.add(st, at(t), db - 8)
        send.add(st, at(t), db - 12)

    # Sound design straight from the cue sheet.
    for cue in TL["cues"]:
        kind = cue["sfx"]
        x = SFX[kind](**cue)
        start = at(cue["t"])
        sfx.add(x, start, cue["gain"], pan=PAN.get(kind, 0.0), width=0.5 if kind in WIDE else 0.15)
        if kind in SEND:
            send.add(x, start, cue["gain"] + SEND[kind])

    # Sidechain pump on pads, arp and bass from every kick.
    duck = np.ones(N)
    for k in kicks:
        n = ns(0.24)
        t = tt(n)
        curve = 1 - 0.6 * (1 - np.clip(t / 0.21, 0, 1) ** 1.6)
        a = ns(0.003)
        curve[:a] = np.linspace(1, curve[a], a)
        e = min(N, k + n)
        duck[k:e] = np.minimum(duck[k:e], curve[: e - k])
    music.x *= duck[:, None]
    bass.x *= np.clip(duck * 1.15, 0, 1)[:, None]

    wet = reverb(send.x, make_ir())
    return {"drums": drums.x, "bass": bass.x, "music": music.x, "sfx": sfx.x, "wet": wet * gain(-3)}


# ── mastering ─────────────────────────────────────────────────────────────────


def gap_mask() -> np.ndarray:
    m = np.ones(N)
    a, b = at(GAP[0]), at(GAP[1])
    r = ns(0.004)
    m[a:b] = 0
    m[a - r : a] = np.linspace(1, 0, r)
    return m


def end_mask() -> np.ndarray:
    m = np.ones(N)
    a, b = at(END_FADE[0]), at(END_FADE[1])
    m[a:b] = np.cos(np.linspace(0, np.pi / 2, b - a)) ** 2
    m[b:] = 0
    return m


def true_peak(x: np.ndarray) -> float:
    up = signal.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limiter(x: np.ndarray, ceiling_db: float, look: float = 0.004, release: float = 0.08) -> np.ndarray:
    """Look-ahead brickwall: min-filtered gain, instant attack, smooth release."""
    c = gain(ceiling_db)
    peak = np.max(np.abs(x), axis=1)
    g = np.minimum(1.0, c / np.maximum(peak, 1e-9))
    w = ns(look)
    g = minimum_filter1d(g, size=2 * w + 1)
    hop = 16
    gd = g[::hop]
    out = np.empty_like(gd)
    a = np.exp(-hop / (release * SR))
    cur = 1.0
    for i, v in enumerate(gd):
        cur = v if v < cur else v + (cur - v) * a
        out[i] = cur
    sm = np.minimum(np.interp(np.arange(len(g)), np.arange(len(g))[::hop], out), g)
    k = np.hanning(2 * w + 1)
    sm2 = np.convolve(sm, k / k.sum(), mode="same")
    return x * np.minimum(sm2, g)[:, None]


def master(stems: dict[str, np.ndarray]) -> np.ndarray:
    gm = gap_mask()[:, None]
    mix = (stems["drums"] + stems["bass"] + stems["music"] + stems["wet"]) * gm + stems["sfx"]
    mix = butter(mix, "high", 28, 2)
    meter = pyln.Meter(SR)
    for _ in range(4):
        lufs = meter.integrated_loudness(mix)
        mix = mix * gain(TARGET_LUFS - lufs)
        mix = limiter(mix, CEILING_DBTP - 0.4)
    mix = mix * end_mask()[:, None]
    tp = true_peak(mix)
    if tp > CEILING_DBTP:
        mix *= gain(CEILING_DBTP - tp)
    return mix


def write_wav(path: pathlib.Path, x: np.ndarray):
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.clip(np.round(x * 32767), -32768, 32767).astype(np.int16)
    wavfile.write(path, SR, pcm)


def main():
    stems = build()
    mix = master(stems)
    assert mix.shape == (N, 2)
    out_wav = ROOT / "public" / "audio" / "soundtrack.wav"
    write_wav(out_wav, mix)
    if "--stems" in sys.argv:
        for name, x in stems.items():
            write_wav(ROOT / "out" / "stems" / f"{name}.wav", x / max(1.0, float(np.max(np.abs(x)))))
    lufs = pyln.Meter(SR).integrated_loudness(mix)
    tail = mix[at(END_FADE[1]) :]
    print(f"wrote {out_wav.relative_to(ROOT)}  {N / SR:.3f} s  {SR} Hz  16-bit stereo")
    print(f"loudness {lufs:.1f} LUFS   true peak {true_peak(mix):.2f} dBTP   silent tail {np.max(np.abs(tail)) == 0}")
    print(f"{len(TL['cues'])} cues placed:")
    for cue in TL["cues"]:
        print(f"  {cue['t']:6.3f} s  frame {int(np.floor(cue['t'] * FPS + 0.5)):>3}  {cue['sfx']}")


if __name__ == "__main__":
    main()
