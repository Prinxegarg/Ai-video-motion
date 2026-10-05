import { AbsoluteFill } from "remotion";
import spectrum from "../data/spectrum.json";
import { useGlobalFrame } from "../components/GlobalFrame";
import { E, pr } from "../lib/ease";
import { section, useBeatClock } from "../lib/time";
import timeline from "../timeline.json";
import { C, F, axes } from "../theme";

const BANDS = spectrum.bands;
const TOTAL = timeline.durationInFrames;

const specAt = (f: number) =>
  spectrum.frames[
    Math.max(0, Math.min(spectrum.frames.length - 1, Math.round(f)))
  ];

/** Peak-hold value for a band: recent maximum, decaying over ~0.4 s. */
const peakAt = (f: number, band: number) => {
  let best = 0;
  for (let k = 0; k < 24; k++) {
    const v = (specAt(f - k)[band] ?? 0) * (1 - k / 30);
    if (v > best) best = v;
  }
  return best;
};

const Stat: React.FC<{ value: number; label: string; t: number }> = ({
  value,
  label,
  t,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      borderTop: `2px solid ${C.ink}`,
      padding: "10px 0 6px",
    }}
  >
    <span style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.14em" }}>
      {label}
    </span>
    <span
      style={{
        fontFamily: F.flex,
        fontSize: 48,
        fontVariationSettings: axes({ wght: 760, wdth: 70 }),
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {Math.round(value * t)}
    </span>
  </div>
);

/**
 * 06 — Data viz, and it's real: the spectrum analyzer, peak caps and loudness
 * envelope are computed from this reel's own soundtrack (src/data/spectrum.json,
 * written by the audio generator), read at the true reel frame. The stats are
 * the reel's actual specs.
 */
export const DataViz: React.FC = () => {
  const { frame } = useBeatClock("data");
  const gf = useGlobalFrame(section("data").from);
  const enter = (d: number) => pr(frame, d, d + 16, E.outExpo);
  const count = pr(frame, 2, 30, E.outQuint);
  const spec = specAt(gf);

  // Envelope path over the whole reel (RMS per frame), drawn up to the playhead.
  const ew = 1080;
  const eh = 150;
  const rms = spectrum.rms;
  const pts = rms.map(
    (v, i) =>
      `${((i / (TOTAL - 1)) * ew).toFixed(1)},${(eh - Math.min(1, v) * eh).toFixed(1)}`,
  );
  const playX = (Math.min(gf, TOTAL - 1) / (TOTAL - 1)) * ew;
  const reveal = pr(frame, 6, 30, E.outExpo);
  const progress = gf / TOTAL;

  return (
    <AbsoluteFill
      style={{ backgroundColor: C.paper, color: C.ink, overflow: "hidden" }}
    >
      {/* header */}
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 112,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F.mono,
          fontSize: 18,
          letterSpacing: "0.14em",
          opacity: enter(0),
        }}
      >
        <span>REEL ANALYTICS — LIVE</span>
        <span>SOURCE: SOUNDTRACK · {BANDS} BANDS · 60 FPS</span>
      </div>

      {/* left: hero stat + specs */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 170,
          width: 470,
          translate: `${(1 - enter(0)) * -60}px 0px`,
          opacity: enter(0),
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
          <span
            style={{
              fontFamily: F.flex,
              fontSize: 270,
              lineHeight: 0.84,
              fontVariationSettings: axes({ wght: 900, wdth: 62, opsz: 144 }),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(timeline.bpm * count)}
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 22,
              letterSpacing: "0.14em",
              paddingBottom: 18,
            }}
          >
            BPM
          </span>
        </div>
        <div style={{ marginTop: 26 }}>
          <Stat value={timeline.fps} label="FRAMES / SEC" t={count} />
          <Stat value={TOTAL} label="FRAMES TOTAL" t={count} />
          <Stat
            value={timeline.totalBeats / timeline.beatsPerBar}
            label="BARS"
            t={count}
          />
        </div>
        {/* progress donut */}
        <div
          style={{
            marginTop: 26,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <svg width={150} height={150} viewBox="-75 -75 150 150">
            <circle
              r={58}
              fill="none"
              stroke={C.ink}
              strokeOpacity={0.15}
              strokeWidth={16}
            />
            <circle
              r={58}
              fill="none"
              stroke={C.red}
              strokeWidth={16}
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={2 * Math.PI * 58 * (1 - progress * enter(4))}
              transform="rotate(-90)"
            />
          </svg>
          <div>
            <div
              style={{
                fontFamily: F.flex,
                fontSize: 64,
                fontVariationSettings: axes({ wght: 800, wdth: 80 }),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(progress * 100 * enter(4))}%
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 16,
                letterSpacing: "0.14em",
              }}
            >
              REEL PLAYED
            </div>
          </div>
        </div>
      </div>

      {/* right: spectrum analyzer */}
      <div
        style={{
          position: "absolute",
          left: 700,
          top: 180,
          width: 1110,
          height: 520,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -2,
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: "0.14em",
            opacity: enter(2),
          }}
        >
          SPECTRUM
        </div>
        <svg
          viewBox="0 0 1110 520"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <line
            x1={0}
            x2={1110}
            y1={500}
            y2={500}
            stroke={C.ink}
            strokeWidth={3}
          />
          {Array.from({ length: BANDS }).map((_, b) => {
            const bw = 1110 / BANDS;
            const grow = enter(2 + b * 0.35);
            const v = Math.min(1, (spec[b] ?? 0) * 1.05);
            const h = Math.max(4, v * 440 * grow);
            const pk = Math.min(1, peakAt(gf, b) * 1.05) * 440 * grow;
            const col = b < 4 ? C.red : C.blue;
            return (
              <g key={b}>
                <rect
                  x={b * bw + 3}
                  y={500 - h}
                  width={bw - 8}
                  height={h}
                  fill={col}
                />
                <rect
                  x={b * bw + 3}
                  y={500 - Math.max(h, pk) - 12}
                  width={bw - 8}
                  height={6}
                  fill={C.ink}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* bottom: loudness envelope of the whole reel */}
      <div
        style={{
          position: "absolute",
          left: 700,
          top: 760,
          width: ew,
          height: eh + 60,
          opacity: enter(5),
        }}
      >
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: "0.14em",
            marginBottom: 10,
          }}
        >
          LOUDNESS · WHOLE REEL
        </div>
        <svg
          viewBox={`0 0 ${ew} ${eh}`}
          style={{ width: ew, height: eh, overflow: "visible" }}
        >
          <rect
            x={0}
            y={0}
            width={ew}
            height={eh}
            fill="none"
            stroke={C.ink}
            strokeOpacity={0.15}
          />
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={i}
              x1={(i / 8) * ew}
              x2={(i / 8) * ew}
              y1={eh - 10}
              y2={eh}
              stroke={C.ink}
              strokeWidth={2}
            />
          ))}
          <polyline
            points={pts.join(" ")}
            fill="none"
            stroke={C.red}
            strokeWidth={3}
            strokeLinejoin="round"
            style={{
              clipPath: `inset(-10px ${(1 - (playX / ew) * reveal) * 100}% -10px 0)`,
            }}
          />
          <line
            x1={playX * reveal}
            x2={playX * reveal}
            y1={-8}
            y2={eh}
            stroke={C.ink}
            strokeWidth={2}
          />
          <circle
            cx={playX * reveal}
            cy={eh - Math.min(1, rms[Math.min(gf, TOTAL - 1)] ?? 0) * eh}
            r={9}
            fill={C.ink}
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
