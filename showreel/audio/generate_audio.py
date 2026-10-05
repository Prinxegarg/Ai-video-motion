#!/usr/bin/env python3
"""
Original soundtrack + sound design for the CLAUDE showreel, synthesised from scratch
with numpy/scipy (no samples, no loops, no third-party audio).

It reads src/timeline.json, the same beat grid and cue sheet the video is built on,
so every hit, whoosh and pluck lands on the frame its animation does.

Writes
  public/audio/soundtrack.wav   48 kHz / 16-bit stereo, exactly the reel's length,
                                mastered to about -14 LUFS with true peak below -1 dBTP
  src/data/spectrum.json        32-band spectrum + momentary loudness per video frame
                                (drives 06 Data Viz and the end card's glow)
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
SPB = SR * 60 / BPM  # samples per beat (22 500 at 128 BPM)
N = int(round(TL["durationInFrames"] / FPS * SR))  # 720 000 = exactly 15.000 s
TARGET_LUFS = -14.0
CEILING_DBTP = -1.2

rng = np.random.default_rng(20260128)


# ── basics ────────────────────────────────────────────────────────────────────


def at(beat: float) -> int:
    """Sample index of a (fractional) beat on the grid."""
    return int(round(beat * SPB))


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


def sfx_suck(beat: float, peakAt: float, **_):
    """Reverse swell that peaks exactly on peakAt, then stops dead."""
    n = at(peakAt) - at(beat)
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
    slice_n = at(1 / 16)
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
    """Computer chatter: square blips on 32nd notes, F minor pentatonic."""
    step = at(1 / 8)
    count = 14
    out = np.zeros(step * count + ns(0.05))
    scale = [77, 80, 82, 84, 87, 89, 92, 94, 96]
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


SFX = {k[4:]: v for k, v in globals().items() if k.startswith("sfx_")}

# Cues that also feed the reverb (send level in dB).
SEND = {"impact": -8, "chime": -6, "pluck": -9, "stamp": -10, "shimmer": -6, "bloop": -10, "tick": -12, "blip": -10, "leader": -16, "hit": -16}
PAN = {"swish": 0.0, "zip": -0.2, "tick": 0.25, "data": 0.3, "bloop": -0.15}


# ── arrangement ───────────────────────────────────────────────────────────────

# One chord per bar (bar 7 splits into iv → V for the build).
CHORDS = [
    (0, "Fm", [53, 56, 60, 63], 41),
    (4, "Fm", [53, 56, 60, 63], 41),
    (8, "Db", [49, 53, 56, 60], 37),
    (12, "Ab", [51, 56, 60, 63], 44),
    (16, "Eb", [51, 55, 58, 63], 39),
    (20, "Db", [49, 53, 56, 60], 37),
    (24, "Bbm", [53, 58, 61, 65], 34),
    (26, "C", [52, 55, 60, 64], 36),
    (28, "Fm(add9)", [53, 56, 60, 67], 41),
]
GROOVE = (4, 26)  # beats where the drums and rolling bass play
GAP = (27.75, 28)  # a 16th of silence before the final impact
END_SILENT = 14.92  # seconds: everything has decayed to digital silence by here


def chord_at(beat: float):
    cur = CHORDS[0]
    for c in CHORDS:
        if beat >= c[0]:
            cur = c
    return cur


def build() -> dict[str, np.ndarray]:
    drums, bass, music, sfx, send = Bus("drums"), Bus("bass"), Bus("music"), Bus("sfx"), Bus("send")

    # Drums: four-on-the-floor, claps on 2 & 4, 16th hats with open hats on the off-beat.
    kicks = [at(b) for b in range(GROOVE[0], GROOVE[1])]
    for k in kicks:
        drums.add(kick(), k, -3.5)
    for b in range(GROOVE[0] + 1, GROOVE[1], 2):
        c = clap()
        drums.add(c, at(b), -8.5, width=0.4)
        send.add(c, at(b), -17)
    for i, b in enumerate(np.arange(GROOVE[0], GROOVE[1], 0.25)):
        frac = b % 1
        if frac == 0.5:
            drums.add(hat(True), at(b), -16.5 + rng.uniform(-0.8, 0.8), pan=0.2)
        else:
            drums.add(hat(False), at(b), (-23 if frac == 0 else -20) + rng.uniform(-1.2, 1.2), pan=-0.25)
    # Intro: soft 8th-note ticks under the countdown, and a riser into the drop.
    for b in np.arange(1, 4, 0.5):
        drums.add(hat(False), at(b + 0.5), -23, pan=0.3)
    i0, i1 = at(0.5), at(3.75)
    it = np.linspace(0, 1, i1 - i0)
    intro = sweep(noise(i1 - i0), 300 * (14 ** it), "band", 0.9) * it**1.8
    intro += osc(hz(41) * (2 ** (it * 2)), i1 - i0, "saw") * it**2 * 0.15
    music.add(edge_fade(intro, 0.01, 0.006), i0, -12, width=0.7)

    # Build (bar 7): snare roll accelerating 8ths → 16ths → 32nds, riser, filtered bass pedal.
    roll = [25.0, 25.5] + [26 + i / 4 for i in range(4)] + [27 + i / 8 for i in range(6)]
    for j, b in enumerate(roll):
        p = j / (len(roll) - 1)
        sn = snare(180 + 120 * p, 0.05 + 0.03 * p)
        drums.add(sn, at(b), -19 + 9 * p, pan=0.08 * (-1) ** j)
        send.add(sn, at(b), -24 + 8 * p)
    r0, r1 = at(24.5), at(GAP[0])
    rn = r1 - r0
    rt = np.linspace(0, 1, rn)
    riser = sweep(noise(rn), 400 * (25 ** rt), "high", 0.7) * rt**2.2 * 0.9
    riser += osc(hz(48) * (2 ** (rt * 1.5)), rn, "saw") * rt**2 * 0.12
    music.add(riser, r0, -13, width=0.6)

    # Rolling bass: the 16ths after each kick, octave hop on the third.
    vel = {1: 0.8, 2: 1.0, 3: 0.85}
    for b in np.arange(GROOVE[0], GROOVE[1], 0.25):
        pos = int(round((b % 1) * 4))
        if pos == 0:
            continue
        _, _, _, root = chord_at(b)
        note = root + (12 if pos == 2 else 0)
        peak = 1500.0
        if 19 <= b < 22:  # liquid wobble under the fluid scene
            peak = 900 + 1500 * (0.5 + 0.5 * np.sin(b * np.pi * 1.5))
        bass.add(bass_note(note, 60 / BPM / 4 * 0.92, peak), at(b), -7 + 20 * np.log10(vel[pos]))
    # Bass pedal under the build (C, filter opening), cut at the gap.
    pn = at(GAP[0]) - at(26)
    pt = np.linspace(0, 1, pn)
    pedal = osc(hz(36), pn, "saw") * 0.6 + osc(hz(36), pn) * 0.6
    pedal = sweep(pedal, 200 + 1800 * pt**2, "low", 2.0)
    bass.add(edge_fade(pedal, 0.004, 0.004), at(26), -11)
    # Final note: F sub under the last impact.
    fn = ns(1.8)
    ft = tt(fn)
    bass.add(osc(hz(29), fn, phase=0.25) * np.exp(-ft / 0.7) + osc(hz(41), fn) * 0.4 * np.exp(-ft / 0.5), at(28), -7)

    # Pads: per-bar chords, filter opening through the reel, pumped by the kick.
    for i, (b0, _, notes, _) in enumerate(CHORDS):
        b1 = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else 32
        dur = (at(b1) - at(b0)) / SR + 0.35
        if b0 == 0:
            cutoff, db = 900, -1
        elif b0 < 24:
            cutoff, db = 1400 + 160 * (b0 - 4) / 4, -5
        elif b0 < 28:
            cutoff, db = 2600, -4
        else:
            cutoff, db, dur = 3200, -3, 1.9
        x = pad(notes, dur, cutoff)
        if b0 == 0:  # intro swell
            x *= np.linspace(0, 1, len(x))[:, None] ** 1.5
        if b0 == 26:  # cut dead at the gap
            x = x[: at(GAP[0]) - at(26)]
            x = edge_fade(x, 0.001, 0.004)
        if b0 >= 28:
            x *= np.exp(-tt(len(x)) / 0.55)[:, None]
        music.add(x, at(b0), db)
        send.add(x, at(b0), db - 6)

    # Sound design straight from the cue sheet.
    for cue in TL["cues"]:
        kind = cue["sfx"]
        x = SFX[kind](**cue)
        start = at(cue["beat"])
        width = 0.5 if kind in ("swish", "shimmer", "zoomOut", "burst", "suck") else 0.15
        sfx.add(x, start, cue["gain"], pan=PAN.get(kind, 0.0), width=width)
        if kind in SEND:
            send.add(x, start, cue["gain"] + SEND[kind])

    # Sidechain pump on pads and bass from every kick.
    duck = np.ones(N)
    for k in kicks:
        n = ns(0.24)
        t = tt(n)
        curve = 1 - 0.62 * (1 - np.clip(t / 0.21, 0, 1) ** 1.6)
        att = ns(0.003)
        curve[:att] = np.linspace(1, curve[att], att)
        e = min(N, k + n)
        duck[k:e] = np.minimum(duck[k:e], curve[: e - k])
    music.x *= duck[:, None]
    bass.x[:, :] *= np.clip(duck * 1.15, 0, 1)[:, None]

    wet = reverb(send.x, make_ir())
    return {"drums": drums.x, "bass": bass.x, "music": music.x, "sfx": sfx.x, "wet": wet * gain(-3)}


# ── mastering ─────────────────────────────────────────────────────────────────


def gap_mask() -> np.ndarray:
    m = np.ones(N)
    a, b = at(GAP[0]), at(GAP[1])
    m[a:b] = 0
    r = ns(0.003)
    m[a - r : a] = np.linspace(1, 0, r)
    return m


def end_mask() -> np.ndarray:
    m = np.ones(N)
    a, b = ns(14.25), ns(END_SILENT)
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
    # smooth: one-pole release run on a decimated envelope, attack stays instant via min()
    hop = 16
    gd = g[::hop]
    out = np.empty_like(gd)
    a = np.exp(-hop / (release * SR))
    cur = 1.0
    for i, v in enumerate(gd):
        cur = v if v < cur else v + (cur - v) * a
        out[i] = cur
    sm = np.interp(np.arange(len(g)), np.arange(len(g))[::hop], out)
    sm = np.minimum(sm, g)  # never exceed the required gain
    # short symmetric smoothing to kill the step edges, then re-clamp
    k = np.hanning(2 * w + 1)
    sm2 = np.convolve(sm, k / k.sum(), mode="same")
    return x * np.minimum(sm2, g)[:, None]


def master(stems: dict[str, np.ndarray]) -> np.ndarray:
    gm = gap_mask()[:, None]
    mix = (stems["drums"] + stems["bass"] + stems["music"] + stems["wet"]) * gm + stems["sfx"]
    mix = butter(mix, "high", 28, 2)  # clear sub-rumble below the kick
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


# ── analysis for the video ────────────────────────────────────────────────────


def analyze(mix: np.ndarray) -> dict:
    mono = mix.mean(axis=1)
    frames = TL["durationInFrames"]
    hop = SR / FPS
    nfft = 2048
    win = np.hanning(nfft)
    freqs = np.fft.rfftfreq(nfft, 1 / SR)
    edges = np.geomspace(40, 16_000, 33)
    centers = np.sqrt(edges[:-1] * edges[1:])
    bins = []
    for i in range(32):
        idx = np.where((freqs >= edges[i]) & (freqs < edges[i + 1]))[0]
        bins.append(idx if len(idx) else np.array([int(np.argmin(np.abs(freqs - centers[i])))]))
    tilt = 3.0 * np.log2(centers / 1000)  # +3 dB/oct so a balanced mix reads flat
    padded = np.concatenate([np.zeros(nfft), mono, np.zeros(nfft)])
    spec = np.zeros((frames, 32))
    rms = np.zeros(frames)
    for f in range(frames):
        c = int((f + 0.5) * hop) + nfft
        seg = padded[c - nfft // 2 : c + nfft // 2] * win
        p = np.abs(np.fft.rfft(seg)) ** 2
        spec[f] = [10 * np.log10(np.mean(p[b]) + 1e-12) for b in bins]
        b = int((f + 1) * hop)  # momentary loudness: RMS of the last 300 ms
        chunk = mono[max(0, b - ns(0.3)) : b]
        rms[f] = 20 * np.log10(np.sqrt(np.mean(chunk**2)) + 1e-9)
    spec = spec + tilt[None, :]
    top = np.percentile(spec, 99.5)
    v = np.clip((spec - (top - 54)) / 54, 0, 1) ** 1.4
    # analyzer ballistics: instant attack, ~120 ms release
    rel = np.exp(-1 / (0.12 * FPS))
    for f in range(1, frames):
        v[f] = np.maximum(v[f], v[f - 1] * rel)
    r = np.clip((rms + 36) / 32, 0, 1)
    return {
        "fps": FPS,
        "bands": 32,
        "bandEdgesHz": [round(float(e), 1) for e in edges],
        "frames": [[round(float(x), 3) for x in row] for row in v],
        "rms": [round(float(x), 3) for x in r],
    }


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
    (ROOT / "src" / "data" / "spectrum.json").write_text(json.dumps(analyze(mix), separators=(",", ":")) + "\n")

    if "--stems" in sys.argv:
        for name, x in stems.items():
            write_wav(ROOT / "out" / "stems" / f"{name}.wav", x / max(1.0, float(np.max(np.abs(x)))))

    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(mix)
    tail = mix[ns(END_SILENT) :]
    print(f"wrote {out_wav.relative_to(ROOT)}  {N / SR:.3f} s  {SR} Hz  16-bit stereo")
    print(f"loudness {lufs:.1f} LUFS   true peak {true_peak(mix):.2f} dBTP   silent tail {np.max(np.abs(tail)) == 0}")
    print(f"{len(TL['cues'])} cues placed on the {BPM} BPM grid:")
    for cue in TL["cues"]:
        s = at(cue["beat"])
        frame = int(np.floor(cue["beat"] * FPS * 60 / BPM + 0.5))  # same rounding as the video (Math.round)
        print(f"  beat {cue['beat']:>6}  {s / SR:7.3f} s  frame {frame:>3}  {cue['sfx']}")


if __name__ == "__main__":
    main()
