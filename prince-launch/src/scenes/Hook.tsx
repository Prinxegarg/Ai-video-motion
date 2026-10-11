import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Mask } from "../components/ui";
import { E, lerp, pr } from "../lib/ease";
import { useScene } from "../lib/time";
import { C, display, label } from "../theme";

/** Fast start, hard brake: the "aggressive counter" curve. */
const countCurve = Easing.bezier(0.55, 0.05, 0.2, 1);

/**
 * 0–3 s — The hook. A power-on line, then the community counter tears from 0 to
 * 100,000, snaps to "100K+" on a bass hit, and the camera punches through it.
 */
export const Hook: React.FC = () => {
  const { frame, at } = useScene("hook");

  const dot = pr(frame, 0, 8, E.outExpo);
  const line =
    pr(frame, at(0.12), at(0.42), E.outExpo) *
    (1 - pr(frame, at(0.42), at(0.52), E.inExpo));
  const count = pr(frame, at(0.45), at(1.35), countCurve);
  const landed = frame >= at(1.35);
  const punch = pr(frame, at(1.35), at(1.35) + 9, E.outBack);
  const n = Math.round(100000 * count);
  const numberIn = pr(frame, at(0.45), at(0.75), E.outExpo);

  const words = [
    pr(frame, at(1.65), at(1.65) + 9, E.outExpo),
    pr(frame, at(1.8), at(1.8) + 9, E.outExpo),
  ];
  const sub = pr(frame, at(1.95), at(1.95) + 10, E.outExpo);

  // Camera: slow push while it holds, then punch through into the drop.
  const push = interpolate(frame, [at(1.35), at(2.4)], [1, 1.07], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const through = pr(frame, at(2.4), at(3), E.inExpo);
  const scale = push * lerp(1, 11, through);
  const fadeOut = 1 - pr(frame, at(2.82), at(3) - 1, E.inExpo);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      {/* power-on */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: 1 - numberIn,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 900 * line,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.white}, transparent)`,
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            background: C.lime,
            scale: `${dot * (1 + 0.25 * Math.sin(frame / 2))}`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          scale: `${scale}`,
          opacity: fadeOut,
          transformOrigin: "50% 42%",
        }}
      >
        {/* the number */}
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center", top: -120 }}
        >
          <div
            style={{
              ...display(330, 900),
              opacity: numberIn,
              scale: `${landed ? lerp(1.14, 1, punch) : lerp(1.5, 1, numberIn)}`,
              filter: landed ? undefined : `blur(${(1 - numberIn) * 14}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {landed ? (
              <>
                100K<span style={{ color: C.lime }}>+</span>
              </>
            ) : (
              n.toLocaleString("en-US")
            )}
          </div>
        </AbsoluteFill>
        {/* underline snap on landing */}
        <div
          style={{
            position: "absolute",
            left: 960 - 300 * punch,
            top: 590,
            width: 600 * punch,
            height: 6,
            background: C.lime,
            opacity: landed
              ? 1 - pr(frame, at(1.9), at(2.3), E.inOut) * 0.6
              : 0,
          }}
        />
        {/* AND COUNTING. */}
        <div
          style={{
            position: "absolute",
            top: 640,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <Mask p={words[0]}>
            <span style={display(78, 800)}>AND</span>
          </Mask>
          <Mask p={words[1]}>
            <span style={display(78, 800)}>
              COUNTING<span style={{ color: C.lime }}>.</span>
            </span>
          </Mask>
        </div>
        <div
          style={{
            position: "absolute",
            top: 770,
            left: 0,
            right: 0,
            textAlign: "center",
            ...label(22, 500),
            opacity: sub,
            translate: `0px ${(1 - sub) * 14}px`,
          }}
        >
          Instagram Community{" "}
          <span
            style={{
              color: C.lime,
              letterSpacing: "0.1em",
              textTransform: "none",
            }}
          >
            · @ai.byprince
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
