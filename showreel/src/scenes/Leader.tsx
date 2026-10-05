import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { E, lerp, pr, tw } from "../lib/ease";
import { useBeatClock } from "../lib/time";
import { C, F, axes } from "../theme";

const NUMBERS = ["3", "2", "1"];

/**
 * Bar 1 — a film-leader countdown rebuilt as motion design: a dot becomes a line,
 * the line becomes crosshairs and rings, a sweep counts the beats, and each numeral
 * morphs from black/extended to hairline/condensed across its beat. Then everything
 * implodes into the drop.
 */
export const Leader: React.FC = () => {
  const { frame, at } = useBeatClock("leader");
  const { fps } = useVideoConfig();

  const dot = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });
  const lineH = pr(frame, at(0.5), at(1), E.outExpo);
  const lineV = pr(frame, at(1), at(1.35), E.outExpo);
  const rings = pr(frame, at(1), at(1.6), E.outExpo);
  const implode = pr(frame, at(3.45), at(4), E.inExpo);
  const chrome = pr(frame, at(0.5), at(1), E.outExpo) * (1 - implode);

  const n = Math.floor(frame / at(1)) - 1; // 0,1,2 during beats 1..3
  const beatStart = at(Math.max(1, Math.min(3, n + 1)));
  const bt = pr(frame, beatStart, beatStart + at(1) - 2, E.linear);
  const sweep = n >= 0 && n <= 2 ? bt * 360 : 0;

  const R = 340;

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <AbsoluteFill
        style={{
          scale: `${lerp(1, 0.02, implode)}`,
          rotate: `${implode * 140}deg`,
          opacity: 1 - pr(frame, at(3.85), at(4), E.inExpo),
        }}
      >
        <svg
          viewBox="-960 -540 1920 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* sweep wedge */}
          {n >= 0 && n <= 2 ? (
            <path
              d={(() => {
                const a = ((sweep - 90) * Math.PI) / 180;
                const large = sweep > 180 ? 1 : 0;
                return `M0 0 L0 ${-R} A${R} ${R} 0 ${large} 1 ${Math.cos(a) * R} ${Math.sin(a) * R} Z`;
              })()}
              fill={n === 2 ? C.red : C.paper}
              opacity={0.13}
            />
          ) : null}
          {/* crosshair */}
          <line
            x1={-900 * lineH}
            x2={900 * lineH}
            y1={0}
            y2={0}
            stroke={C.paper}
            strokeWidth={2}
            opacity={0.85}
          />
          <line
            x1={0}
            x2={0}
            y1={-520 * lineV}
            y2={520 * lineV}
            stroke={C.paper}
            strokeWidth={2}
            opacity={0.85}
          />
          {/* rings */}
          {[R, R + 46].map((r, i) => (
            <circle
              key={r}
              r={r}
              fill="none"
              stroke={C.paper}
              strokeWidth={i === 0 ? 3 : 1.5}
              strokeDasharray={`${2 * Math.PI * r}`}
              strokeDashoffset={2 * Math.PI * r * (1 - rings)}
              transform="rotate(-90)"
              opacity={0.9}
            />
          ))}
          {/* tick ring */}
          <g transform={`rotate(${frame * 0.6})`} opacity={rings * 0.6}>
            {Array.from({ length: 72 }).map((_, i) => (
              <line
                key={i}
                x1={0}
                x2={0}
                y1={-(R + 70)}
                y2={-(R + (i % 6 === 0 ? 96 : 80))}
                stroke={C.paper}
                strokeWidth={i % 6 === 0 ? 3 : 1.5}
                transform={`rotate(${i * 5})`}
              />
            ))}
          </g>
          {/* origin dot */}
          <circle r={9 * dot * (1 - rings * 0.4)} fill={C.red} />
        </svg>

        {/* numerals */}
        {NUMBERS.map((num, i) => {
          const s = at(i + 1);
          const e = at(i + 2);
          if (frame < s || frame >= e) return null;
          const p = pr(frame, s, e - 1, E.inOut);
          const pop = pr(frame, s, s + 8, E.outExpo);
          return (
            <AbsoluteFill
              key={num}
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <div
                style={{
                  fontFamily: F.flex,
                  fontSize: 470,
                  lineHeight: 1,
                  color: i === 2 ? C.red : C.paper,
                  fontVariationSettings: axes({
                    wght: lerp(1000, 120, p),
                    wdth: lerp(151, 25, p),
                    opsz: 144,
                  }),
                  scale: `${lerp(1.35, 1, pop)}`,
                  translate: "0px -8px",
                }}
              >
                {num}
              </div>
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>

      {/* leader chrome */}
      <AbsoluteFill
        style={{
          fontFamily: F.mono,
          color: C.paper,
          fontSize: 18,
          letterSpacing: "0.1em",
          opacity: chrome * 0.75,
        }}
      >
        <div style={{ position: "absolute", left: 48, top: 40 }}>
          CLAUDE — MOTION DESIGN REEL
        </div>
        <div style={{ position: "absolute", right: 48, top: 40 }}>2026</div>
        <div style={{ position: "absolute", left: 48, bottom: 42 }}>
          1920×1080 · 60 FPS · 128 BPM
        </div>
        <div
          style={{
            position: "absolute",
            right: 48,
            bottom: 42,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          REEL STARTS IN {Math.max(0, 3 - Math.max(0, n)).toString()}
        </div>
        {/* registration marks */}
        {[
          [120, 140],
          [1800, 140],
          [120, 940],
          [1800, 940],
        ].map(([x, y], i) => (
          <svg
            key={i}
            width={60}
            height={60}
            viewBox="-30 -30 60 60"
            style={{ position: "absolute", left: x - 30, top: y - 30 }}
          >
            <circle r={14} fill="none" stroke={C.paper} strokeWidth={1.5} />
            <line
              x1={-26}
              x2={26}
              y1={0}
              y2={0}
              stroke={C.paper}
              strokeWidth={1.5}
            />
            <line
              y1={-26}
              y2={26}
              x1={0}
              x2={0}
              stroke={C.paper}
              strokeWidth={1.5}
            />
          </svg>
        ))}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundColor: C.paper,
          opacity: tw(frame, at(3.9), at(4), 0, 0.9, E.inExpo),
        }}
      />
    </AbsoluteFill>
  );
};
