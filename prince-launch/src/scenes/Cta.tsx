import { useMemo } from "react";
import { AbsoluteFill, random } from "remotion";
import wordmark from "../data/wordmark.json";
import { CameraGlyph, Mask } from "../components/ui";
import { E, clamp01, lerp, pr } from "../lib/ease";
import { useScene } from "../lib/time";
import { C, display, F } from "../theme";

const WM_LEFT = (1920 - wordmark.width) / 2;
const WM_TOP = 300;
const R = 4.7;

/**
 * 26–30 s — The CTA. On the final hit, 731 dots fly in and lock into a
 * dot-matrix PRINCE GARG wordmark (sampled from Inter ExtraBold), the role line,
 * the call to action and the handle follow on the beats, and everything fades
 * to black on the last note.
 */
export const Cta: React.FC = () => {
  const { frame, at } = useScene("cta");

  const dots = useMemo(
    () =>
      wordmark.points.map(([tx, ty], i) => {
        const a = random(`a${i}`) * Math.PI * 2;
        const r = 650 + random(`r${i}`) * 900;
        return {
          tx,
          ty,
          sx: wordmark.width / 2 + Math.cos(a) * r,
          sy: wordmark.height / 2 + Math.sin(a) * r * 0.6,
          delay: (tx / wordmark.width) * 9 + random(`d${i}`) * 6,
          lime: random(`l${i}`) > 0.965,
          tw: random(`t${i}`) * Math.PI * 2,
        };
      }),
    [],
  );

  const flash = 1 - pr(frame, 0, 9, E.outExpo);
  const role = pr(frame, at(26.5), at(26.5) + 10, E.outExpo);
  const cta = pr(frame, at(27.0), at(27.0) + 10, E.outExpo);
  const handle = pr(frame, at(27.5), at(27.5) + 10, E.outBack);
  const stop = pr(frame, at(26.95), at(26.95) + 8, E.outBack);
  const beat = frame >= at(29) ? Math.exp(-(frame - at(29)) / 5) : 0;
  const push = 1 + 0.035 * pr(frame, 0, at(29.8), E.linear);
  const fade = 1 - pr(frame, at(29.0), at(29.8), E.inOut);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, rgba(255,255,255,${0.22 * flash}) 0%, rgba(255,255,255,0) 55%)`,
        }}
      />
      <AbsoluteFill style={{ scale: `${push}`, opacity: fade }}>
        {/* dot-matrix wordmark */}
        <svg
          width={wordmark.width + 80}
          height={wordmark.height + 80}
          viewBox={`-40 -40 ${wordmark.width + 80} ${wordmark.height + 80}`}
          style={{
            position: "absolute",
            left: WM_LEFT - 40,
            top: WM_TOP - 40,
            overflow: "visible",
          }}
        >
          {dots.map((d, i) => {
            const p = E.outExpo(clamp01((frame - d.delay) / 16));
            const x = lerp(d.sx, d.tx, p);
            const y = lerp(d.sy, d.ty, p);
            const twinkle =
              p >= 1 ? 0.85 + 0.15 * Math.sin(frame / 4 + d.tw) : 1;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={R * lerp(2.6, 1, p)}
                fill={d.lime ? C.lime : C.white}
                opacity={(p > 0 ? Math.min(1, p * 1.6) : 0) * twinkle}
              />
            );
          })}
          {/* the full stop */}
          <rect
            x={wordmark.width + 12}
            y={wordmark.height - 30}
            width={30}
            height={30}
            fill={C.lime}
            transform={`translate(${wordmark.width + 27} ${wordmark.height - 15}) scale(${stop * (1 + beat * 0.6)}) translate(${-(wordmark.width + 27)} ${-(wordmark.height - 15)})`}
          />
        </svg>

        {/* role */}
        <div
          style={{
            position: "absolute",
            top: 540,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Mask p={role}>
            <span
              style={{
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 32,
                letterSpacing: "0.42em",
                color: C.white,
              }}
            >
              CREATOR <span style={{ color: C.lime }}>×</span> ENTREPRENEUR
            </span>
          </Mask>
        </div>

        {/* call to action */}
        <div
          style={{
            position: "absolute",
            top: 640,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Mask p={cta}>
            <span style={display(84, 800)}>
              LET’S BUILD SOMETHING<span style={{ color: C.lime }}>.</span>
            </span>
          </Mask>
        </div>

        {/* handle */}
        <div
          style={{
            position: "absolute",
            top: 812,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 34px",
              borderRadius: 999,
              border: `2px solid ${C.lime}`,
              background: "rgba(199,255,61,0.08)",
              boxShadow: `0 0 ${30 + beat * 40}px rgba(199,255,61,${0.18 + beat * 0.3})`,
              scale: `${handle}`,
              opacity: handle > 0.01 ? 1 : 0,
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 36,
              letterSpacing: "0.04em",
              color: C.white,
            }}
          >
            <CameraGlyph size={34} color={C.lime} />
            @ai.byprince
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
