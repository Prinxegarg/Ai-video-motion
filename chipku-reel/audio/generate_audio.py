#!/usr/bin/env python3
"""Original music + sound design for the CHIPKU reel, synthesised from scratch.

Every sound effect is placed from the cue sheet in src/timeline.json — the same
file the Remotion scenes read their animation timings from — so audio and
picture stay frame-locked.

Outputs
  public/audio/chipku-soundtrack.wav   final master used by the video (48 kHz, 16-bit, stereo, 20.000 s)
  audio/stems/music.wav                music bed only
  audio/stems/sfx.wav                  sound effects only
  audio/sfx/*.wav                      every one-shot effect, individually
  audio/cue-report.json                where each effect was placed + loudness stats

Usage:  python3 audio/generate_audio.py        (requires numpy, scipy; pyloudnorm optional)
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parents[1]
TIMELINE = json.loads((ROOT / "src" / "timeline.json").read_text())

SR = 48_000
FPS = TIMELINE["fps"]
DURATION = TIMELINE["durationInFrames"] / FPS  # exactly 20.0 s
N = int(round(DURATION * SR))
BPM = TIMELINE["bpm"]
BEAT = 60.0 / BPM
RNG = np.random.default_rng(20251004)


# ───────────────────────────── helpers ─────────────────────────────
def t_of(n: int) -> np.ndarray:
    return np.arange(n) / SR


def db(x: float) -> float:
    return 10 ** (x / 20)


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def frame_t(frame: float) -> float:
    return frame / FPS


def sine(freq, n: int, phase: float = 0.0) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def saw(freq: float, n: int) -> np.ndarray:
    return signal.sawtooth(2 * np.pi * freq * t_of(n))


def noise(n: int) -> np.ndarray:
    return RNG.standard_normal(n)


def lp(x: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    return signal.sosfilt(signal.butter(order, min(hz, SR * 0.45), "low", fs=SR, output="sos"), x)


def hp(x: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    return signal.sosfilt(signal.butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x: np.ndarray, lo: float, hi: float, order: int = 2) -> np.ndarray:
    return signal.sosfilt(signal.butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x)


def sweep_bp(x: np.ndarray, centers: np.ndarray, q: float = 1.2, block: int = 256) -> np.ndarray:
    """Band-pass with a time-varying centre frequency (block-wise, state carried)."""
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        c = float(np.clip(centers[min(i, len(centers) - 1)], 60, SR * 0.4))
        lo, hi = c / (1 + 1 / (2 * q)), c * (1 + 1 / (2 * q))
        sos = signal.butter(2, [lo, hi], "band", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i : i + block], zi = signal.sosfilt(sos, x[i : i + block], zi=zi)
    return out


def env_ad(n: int, attack: float, decay: float, curve: float = 1.0) -> np.ndarray:
    t = t_of(n)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-np.clip(t - attack, 0, None) / max(decay, 1e-4)) ** curve
    return a * d


def fade(x: np.ndarray, fin: float = 0.002, fout: float = 0.01) -> np.ndarray:
    y = x.copy()
    i, o = int(fin * SR), int(fout * SR)
    if i:
        y[:i] *= np.linspace(0, 1, i)
    if o:
        y[-o:] *= np.linspace(1, 0, o)
    return y


def normalize(x: np.ndarray, peak_db: float = 0.0) -> np.ndarray:
    m = np.max(np.abs(x)) or 1.0
    return x / m * db(peak_db)


def stereo(x: np.ndarray, pan: float = 0.0, width: float = 0.0) -> np.ndarray:
    """Equal-power pan (-1..1) with optional Haas-style width."""
    lgain = np.cos((pan + 1) * np.pi / 4)
    rgain = np.sin((pan + 1) * np.pi / 4)
    left, right = x * lgain, x * rgain
    if width > 0:
        d = int(width * 0.012 * SR)
        right = np.concatenate([np.zeros(d), right[:-d]]) if d else right
    return np.stack([left, right], axis=1) * np.sqrt(2)


def add(bus: np.ndarray, clip: np.ndarray, start_s: float, gain: float = 1.0) -> None:
    s = int(round(start_s * SR))
    if s >= len(bus):
        return
    if clip.ndim == 1:
        clip = stereo(clip)
    e = min(len(bus), s + len(clip))
    if s < 0:
        clip, s = clip[-s:], 0
    bus[s:e] += clip[: e - s] * gain


def reverb_ir(seconds: float = 1.6, decay: float = 0.45, seed: int = 3) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = t_of(n)
    ir = rng.standard_normal((n, 2)) * np.exp(-t / decay)[:, None]
    ir[:, 0], ir[:, 1] = lp(ir[:, 0], 7000), lp(ir[:, 1], 6500)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt(np.sum(ir**2))


IR = reverb_ir()


def reverb(x: np.ndarray, wet: float = 0.25) -> np.ndarray:
    if x.ndim == 1:
        x = stereo(x)
    wl = signal.fftconvolve(x[:, 0], IR[:, 0])[: len(x)]
    wr = signal.fftconvolve(x[:, 1], IR[:, 1])[: len(x)]
    return x * (1 - wet) + np.stack([wl, wr], axis=1) * wet * 3.0


# ───────────────────────────── sound effects ─────────────────────────────
def sfx_tick(pitch: float = 1.0) -> np.ndarray:
    n = int(0.04 * SR)
    body = sine(3000 * pitch, n) * env_ad(n, 0.0005, 0.006)
    snap = hp(noise(n), 4000) * env_ad(n, 0.0002, 0.002)
    return fade(normalize(body * 0.7 + snap * 0.5))


def sfx_click() -> np.ndarray:
    n = int(0.09 * SR)
    transient = hp(noise(n), 2500) * env_ad(n, 0.0002, 0.003)
    tock = sine(1750, n) * env_ad(n, 0.0005, 0.018)
    body = sine(620, n) * env_ad(n, 0.001, 0.025)
    return fade(normalize(transient * 0.6 + tock * 0.8 + body * 0.5))


def sfx_pop(pitch: float = 1.0) -> np.ndarray:
    n = int(0.16 * SR)
    t = t_of(n)
    f = 520 * pitch * (1 + 1.4 * np.exp(-t / 0.012))
    tone = sine(f, n) * env_ad(n, 0.002, 0.05)
    click = bp(noise(n), 1500, 6000) * env_ad(n, 0.0003, 0.004)
    return fade(normalize(lp(tone + click * 0.25, 9000)))


def sfx_shutter() -> np.ndarray:
    n = int(0.22 * SR)
    one = hp(noise(n), 1800) * env_ad(n, 0.0003, 0.008) + sine(2300, n) * env_ad(n, 0.0005, 0.012) * 0.6
    two = np.roll(one, int(0.055 * SR)) * 0.7
    whir = bp(noise(n), 900, 2600) * env_ad(n, 0.03, 0.05) * 0.25
    pop = sfx_pop(1.1)
    out = one + two + whir
    out[: len(pop)] += pop * 0.6
    return fade(normalize(out))


def sfx_slap() -> np.ndarray:
    n = int(0.5 * SR)
    t = t_of(n)
    thump = sine(95 * (1 + 0.8 * np.exp(-t / 0.03)), n) * env_ad(n, 0.002, 0.11)
    paper = bp(noise(n), 700, 4500) * env_ad(n, 0.0005, 0.035)
    crack = hp(noise(n), 3000) * env_ad(n, 0.0002, 0.006)
    return fade(normalize(reverb(np.tanh(1.6 * (thump + paper * 0.55 + crack * 0.3)), 0.15)[:, 0]))


def sfx_impact() -> np.ndarray:
    n = int(1.3 * SR)
    t = t_of(n)
    sub = sine(62 * (1 + 1.2 * np.exp(-t / 0.05)), n) * env_ad(n, 0.002, 0.32)
    body = lp(noise(n), 1400) * env_ad(n, 0.001, 0.09)
    air = hp(noise(n), 5000) * env_ad(n, 0.0005, 0.02)
    dry = np.tanh(1.4 * (sub + body * 0.5 + air * 0.15))
    return fade(normalize(reverb(dry, 0.22)[:, 0]), fout=0.2)


def whoosh(length: float, f0: float, f1: float, f2: float, peak: float, q: float = 1.4) -> np.ndarray:
    n = int(length * SR)
    t = t_of(n)
    up = np.clip(t / peak, 0, 1)
    centers = np.where(t < peak, f0 * (f1 / f0) ** up, f1 * (f2 / f1) ** np.clip((t - peak) / (length - peak), 0, 1))
    x = sweep_bp(noise(n), centers, q=q)
    env = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) / (0.28 * (length - peak))))
    return fade(normalize(x * env), 0.005, 0.05)


def sfx_whoosh() -> np.ndarray:
    return whoosh(0.9, 350, 3200, 700, 0.45)


def sfx_whoosh_soft() -> np.ndarray:
    return whoosh(0.5, 500, 2200, 900, 0.22, q=1.1)


def sfx_whoosh_low() -> np.ndarray:
    return whoosh(1.0, 140, 1100, 300, 0.48, q=1.0)


def sfx_swish() -> np.ndarray:
    return whoosh(0.3, 1500, 6000, 3500, 0.12, q=1.0)


def sfx_chime(note: float) -> np.ndarray:
    n = int(1.6 * SR)
    f = midi(note)
    partials = [(1.0, 1.0, 0.9), (2.0, 0.45, 0.5), (3.01, 0.25, 0.32), (4.17, 0.14, 0.2), (5.43, 0.08, 0.12)]
    x = sum(a * sine(f * m, n) * env_ad(n, 0.002, d) for m, a, d in partials)
    return fade(normalize(reverb(x, 0.3)[:, 0]), fout=0.3)


def sfx_sparkle() -> np.ndarray:
    n = int(0.9 * SR)
    out = np.zeros(n)
    notes = [86, 90, 93, 98, 95, 102, 91, 97]
    for k, m in enumerate(notes):
        s = int((0.035 * k + RNG.uniform(0, 0.02)) * SR)
        ln = n - s
        out[s:] += sine(midi(m), ln) * env_ad(ln, 0.001, 0.09) * (0.9 - k * 0.07)
    return fade(normalize(reverb(out, 0.35)[:, 0]), fout=0.3)


def sfx_typing(chars: int, frames_per_char: float) -> np.ndarray:
    step = frames_per_char / FPS
    n = int((chars * step + 0.1) * SR)
    out = np.zeros(n)
    for k in range(chars):
        clip = sfx_tick(RNG.uniform(0.75, 1.15)) * RNG.uniform(0.7, 1.0)
        s = int(k * step * SR)
        out[s : s + len(clip)] += clip[: n - s]
    return fade(normalize(out))


def make_sfx(cue: dict) -> np.ndarray:
    kind = cue["sfx"]
    if kind == "tick":
        return sfx_tick()
    if kind == "click":
        return sfx_click()
    if kind == "pop":
        return sfx_pop(cue.get("pitch", 1.0))
    if kind == "shutter":
        return sfx_shutter()
    if kind == "slap":
        return sfx_slap()
    if kind == "impact":
        return sfx_impact()
    if kind == "whoosh":
        return sfx_whoosh()
    if kind == "whooshSoft":
        return sfx_whoosh_soft()
    if kind == "whooshLow":
        return sfx_whoosh_low()
    if kind == "swish":
        return sfx_swish()
    if kind == "chime":
        return sfx_chime(cue.get("note", 76))
    if kind == "sparkle":
        return sfx_sparkle()
    if kind == "typing":
        return sfx_typing(cue["chars"], cue["framesPerChar"])
    raise ValueError(f"unknown sfx {kind}")


# Whooshes swell before they peak: start them early so the peak lands on the cut.
PEAK_OFFSET = {"whoosh": 0.45, "whooshLow": 0.48}


# ───────────────────────────── music ─────────────────────────────
M = TIMELINE["music"]
DROP = frame_t(M["drop"])
WHIP = frame_t(M["whipFill"])
ARP_IN = frame_t(M["arpIn"])
PRE_BREAK = frame_t(M["preBreakRiser"])
BREAK = frame_t(M["break"])
OUTRO = frame_t(M["outro"])
FINAL = frame_t(M["finalHit"])
SILENT = frame_t(M["silentFrom"])
RISER = frame_t(M["riserStart"])

# Chords (D major: I–V–vi–IV), as (start, end, notes, bass)
D_ = ([62, 66, 69, 74], 38)
A_ = ([61, 64, 69, 73], 33)
Bm = ([62, 66, 71, 74], 35)
G_ = ([62, 67, 71, 74], 31)
CHORDS = [
    (0.0, 2.0, *D_), (2.0, DROP, *A_),
    (DROP, 5.0, *D_), (5.0, 7.0, *A_), (7.0, 9.0, *Bm), (9.0, 11.0, *G_),
    (11.0, 13.0, *D_), (13.0, BREAK, *A_),
    (BREAK, OUTRO, *G_),
    (OUTRO, 17.0, *D_), (17.0, 18.0, *A_), (18.0, FINAL, *Bm),
]


def chord_at(t: float):
    for s, e, notes, bass in CHORDS:
        if s <= t < e:
            return notes, bass
    return D_


def groove_on(t: float) -> bool:
    return (DROP <= t < BREAK and not (WHIP + 0.25 <= t < 6.0)) or (OUTRO <= t < FINAL)


def kick() -> np.ndarray:
    n = int(0.35 * SR)
    t = t_of(n)
    body = sine(48 * (1 + 2.6 * np.exp(-t / 0.028)), n) * env_ad(n, 0.001, 0.12)
    click = hp(noise(n), 3000) * env_ad(n, 0.0002, 0.003) * 0.25
    return np.tanh(1.5 * (body + click))


def clap() -> np.ndarray:
    n = int(0.3 * SR)
    burst = np.zeros(n)
    for k, d in enumerate([0, 0.009, 0.018]):
        s = int(d * SR)
        burst[s:] += env_ad(n - s, 0.0005, 0.006 if k < 2 else 0.07)
    return bp(noise(n), 900, 5000) * burst


def hat(open_: bool = False) -> np.ndarray:
    n = int((0.25 if open_ else 0.05) * SR)
    return hp(noise(n), 7000) * env_ad(n, 0.0005, 0.08 if open_ else 0.012)


def pluck(note: float, length: float = 0.32) -> np.ndarray:
    n = int(length * SR)
    f = midi(note)
    x = saw(f, n) * 0.6 + saw(f * 1.004, n) * 0.4
    cutoff = 800 + 3200 * np.exp(-t_of(n) / 0.06)
    return lp(x, float(np.mean(cutoff)), 2) * env_ad(n, 0.003, 0.12)


def pad(notes, length: float, cutoff: float = 1800) -> np.ndarray:
    n = int(length * SR)
    x = sum(saw(midi(m), n) + saw(midi(m) * 1.006, n) for m in notes) / (2 * len(notes))
    env = np.clip(t_of(n) / 0.35, 0, 1) * np.clip((length - t_of(n)) / 0.3, 0, 1)
    return lp(x, cutoff, 2) * env


def bass_note(m: float, length: float) -> np.ndarray:
    n = int(length * SR)
    f = midi(m)
    x = np.tanh(2.2 * (sine(f, n) + 0.35 * sine(2 * f, n)))
    return lp(x, 900) * env_ad(n, 0.004, length * 0.6)


def build_music() -> np.ndarray:
    drums = np.zeros((N, 2))
    harm = np.zeros((N, 2))
    bassb = np.zeros((N, 2))
    arp = np.zeros((N, 2))
    kick_times: list[float] = []

    # Intro + break pads, plus chord pads under the groove (quiet)
    for s, e, notes, _ in CHORDS:
        if e <= s:
            continue
        level = 0.8 if s < DROP else (0.55 if BREAK <= s < OUTRO else 0.22)
        cut = 1300 if s < DROP else 2200
        add(harm, stereo(pad(notes, e - s + 0.25, cut), width=0.6), s, level)

    sixteenth = BEAT / 4
    steps = int(np.ceil(FINAL / sixteenth))
    for k in range(steps):
        t = k * sixteenth
        pos = k % 16  # position in bar (4 beats × 4 sixteenths)
        notes, bass = chord_at(t + 1e-6)
        if groove_on(t):
            if pos % 4 == 0:
                add(drums, kick(), t, 0.95)
                kick_times.append(t)
            if pos in (4, 12):
                add(drums, stereo(clap(), width=0.5), t, 0.45)
            if pos % 2 == 1:
                add(drums, stereo(hat(), pan=0.25), t, 0.22 if pos % 4 == 2 else 0.16)
            if pos == 14:
                add(drums, stereo(hat(True), pan=-0.2), t, 0.12)
            # bass: driving 8ths on the root, octave pop on the "and" of 2 and 4
            if pos % 2 == 0:
                m = bass + (12 if pos in (6, 14) else 0)
                add(bassb, bass_note(m, sixteenth * 2), t, 0.55)
            # chord stabs on syncopated off-beats
            if pos in (2, 6, 10, 13):
                for j, m in enumerate(notes):
                    add(harm, stereo(pluck(m), pan=-0.35 + 0.23 * j), t, 0.16)
        elif t < DROP and t >= 0.5 and pos % 2 == 1:
            add(drums, stereo(hat(), pan=0.25), t, 0.13)  # intro ticking hats
        # sparkle arpeggio under the offers
        if ARP_IN <= t < BREAK or OUTRO <= t < FINAL:
            seq = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12]
            m = seq[k % 4]
            n_ = int(0.18 * SR)
            ping = (sine(midi(m), n_) * 0.7 + sine(midi(m) * 2, n_) * 0.15) * env_ad(n_, 0.002, 0.06)
            add(arp, stereo(ping, pan=0.5 * np.sin(k * 0.7)), t, 0.09)

    # Drum fill into the categories whip (snare roll)
    roll_t = np.arange(WHIP + 0.25, 6.0, BEAT / 8)
    for i, t in enumerate(roll_t):
        add(drums, stereo(clap(), width=0.3), t, 0.12 + 0.3 * i / len(roll_t))

    # Risers (filtered noise swells) into the drop and into the break
    for start, end, lvl in [(RISER, DROP, 0.35), (PRE_BREAK, BREAK, 0.3)]:
        n = int((end - start) * SR)
        cent = 300 * (6000 / 300) ** np.linspace(0, 1, n)
        r = sweep_bp(noise(n), cent, q=1.6) * np.linspace(0, 1, n) ** 2
        add(arp, stereo(normalize(r), width=0.8), start, lvl)

    # Final hit: full D-major chord + sub, ringing out
    final_notes = [50, 62, 66, 69, 74, 78]
    hit = sum(pluck(m, 1.6) for m in final_notes)
    hit[: int(1.4 * SR)] += bass_note(38, 1.4)
    add(harm, reverb(stereo(normalize(hit), width=0.5), 0.35), FINAL, 0.75)
    add(drums, kick(), FINAL, 1.0)

    # Sidechain-style ducking of bass + harmony from the kick
    duck = np.ones(N)
    dn = int(0.18 * SR)
    shape = 1 - 0.55 * np.exp(-t_of(dn) / 0.06)
    for t in kick_times:
        s = int(t * SR)
        e = min(N, s + dn)
        duck[s:e] = np.minimum(duck[s:e], shape[: e - s])
    bassb *= duck[:, None]
    harm *= (0.5 + 0.5 * duck)[:, None]

    music = drums + harm + bassb + reverb(arp, 0.4)
    music = reverb(music, 0.08)
    # Clean ending: nothing after SILENT
    t = t_of(N)
    tail = np.clip((SILENT - t) / 0.8, 0, 1) ** 1.5
    music *= tail[:, None]
    return music


# ───────────────────────────── master ─────────────────────────────
def limiter(x: np.ndarray, ceiling_db: float = -1.5, lookahead: float = 0.004, release: float = 0.08) -> np.ndarray:
    """Look-ahead peak limiter: gain dips *before* each peak, then recovers smoothly."""
    from scipy.ndimage import minimum_filter1d

    ceiling = db(ceiling_db)
    need = np.minimum(1.0, ceiling / np.maximum(np.max(np.abs(x), axis=1), 1e-9))
    la = max(1, int(lookahead * SR))
    need = minimum_filter1d(need, size=2 * la + 1, mode="nearest")  # look-ahead + hold
    g = np.empty_like(need)
    a = np.exp(-1 / (release * SR))
    cur = 1.0
    for i, v in enumerate(need):
        cur = v if v < cur else a * cur + (1 - a) * v
        g[i] = cur
    # a short smoothing pass removes zipper noise from the instant attack
    g = signal.filtfilt(*signal.butter(1, 200, fs=SR), g)
    g = np.minimum(g, need * 1.0005)
    return x * g[:, None]


def true_peak_db(x: np.ndarray) -> float:
    up = signal.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def write_wav(path: Path, x: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    dither = (RNG.random(x.shape) - RNG.random(x.shape)) / 32768.0
    y = np.clip(x + dither, -1, 1)
    wavfile.write(str(path), SR, (y * 32767).astype(np.int16))


def main() -> None:
    sfx_dir = ROOT / "audio" / "sfx"
    sfx_dir.mkdir(parents=True, exist_ok=True)
    for old in sfx_dir.glob("*.wav"):
        old.unlink()  # keep the folder in sync with the current cue sheet

    music = build_music()
    music = normalize(music, -9.0)

    sfx = np.zeros((N, 2))
    report = []
    exported: set[str] = set()
    for cue_id, cue in TIMELINE["cues"].items():
        if not cue.get("sfx"):
            continue
        clip = make_sfx(cue)
        start = frame_t(cue["frame"]) - PEAK_OFFSET.get(cue["sfx"], 0.0)
        # gentle stereo placement for variety
        pan = float(np.clip(np.sin(cue["frame"] * 0.37) * 0.25, -0.3, 0.3))
        add(sfx, stereo(clip, pan=pan, width=0.15), start, db(cue.get("gain", -18)))
        key = cue["sfx"] + (f"-{cue['note']}" if "note" in cue else "") + (f"-p{cue['pitch']}" if "pitch" in cue else "")
        if key not in exported:
            write_wav(sfx_dir / f"{key}.wav", stereo(normalize(clip, -1.0)) / np.sqrt(2))
            exported.add(key)
        report.append({"cue": cue_id, "frame": cue["frame"], "time": round(frame_t(cue["frame"]), 3), "sfx": cue["sfx"], "gainDb": cue.get("gain")})

    # Duck the music slightly under the big moments so effects stay on top
    mix = music * db(-1.0) + sfx * db(4.0)
    t = t_of(N)
    mix *= np.clip((SILENT - t) / 0.35, 0, 1)[:, None]  # clean, silent ending
    # Loudness target for social video (~ -14 LUFS), then limit peaks.
    try:
        import pyloudnorm as pyln

        lufs = pyln.Meter(SR).integrated_loudness(mix)
        gain_db = float(np.clip(-14.0 - lufs, -6.0, 6.0))
    except Exception:  # fallback: RMS-based estimate
        gain_db = float(np.clip(-17.0 - 20 * np.log10(np.sqrt(np.mean(mix**2)) + 1e-12), -6.0, 6.0))
    mix *= db(gain_db)
    pre_peak = 20 * np.log10(np.max(np.abs(mix)) + 1e-12)

    master = mix.copy()
    for _ in range(3):  # iterate until the 4× oversampled true peak is below -1 dBTP
        master = limiter(master, -1.5)
        if true_peak_db(master) <= -1.05:
            break
        master *= db(-0.5)
    master[int(SILENT * SR):] = 0.0

    out = ROOT / "public" / "audio" / "chipku-soundtrack.wav"
    write_wav(out, master)
    write_wav(ROOT / "audio" / "stems" / "music.wav", music)
    write_wav(ROOT / "audio" / "stems" / "sfx.wav", normalize(sfx, -3))

    stats = {
        "durationSeconds": len(master) / SR,
        "samples": len(master),
        "loudnessGainDb": round(gain_db, 2),
        "preLimiterPeakDb": round(pre_peak, 2),
        "samplePeakDb": round(20 * np.log10(np.max(np.abs(master)) + 1e-12), 2),
        "truePeakDbTP": round(true_peak_db(master), 2),
        "rmsDb": round(20 * np.log10(np.sqrt(np.mean(master**2)) + 1e-12), 2),
        "lastNonSilentSecond": round(np.max(np.nonzero(np.max(np.abs(master), axis=1) > 1e-4)) / SR, 3),
    }
    try:
        import pyloudnorm as pyln

        stats["integratedLUFS"] = round(pyln.Meter(SR).integrated_loudness(master), 1)
    except Exception:  # pyloudnorm is optional
        pass
    (ROOT / "audio" / "cue-report.json").write_text(json.dumps({"stats": stats, "cues": report}, indent=2) + "\n")
    print(json.dumps(stats, indent=2))
    print(f"placed {len(report)} sound effects → {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
