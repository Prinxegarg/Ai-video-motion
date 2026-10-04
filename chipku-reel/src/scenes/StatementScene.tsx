import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { Avatar } from "../components/Avatar";
import { Hud } from "../components/Chrome";
import { useAbsFrame } from "../components/Scene";
import { Bg, Camera } from "../components/Transitions";
import { Accent, Eyebrow, Word } from "../components/Type";
import { CLAMP, cue, transitionRange, wave } from "../lib/motion";
import { C, F } from "../theme";

/** Beat 3a — on black (reference: dither into "Build yours."): "Stick your vibe." */
export const StatementScene: React.FC = () => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const [, ditherEnd] = transitionRange("ditherToBlack");
  const [wipeStart, wipeEnd] = transitionRange("circleToPaper");
  const enter = spring({ frame: frame - cue("statement.avatar"), fps, config: { damping: 13, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <Bg color={C.ink} />
      <Camera start={ditherEnd} end={wipeEnd} from={1.06} to={1.0}>
        <Avatar
          arm={-20 + wave(frame, 14) * 16}
          grin={1}
          brows={0.8}
          lookX={-0.6}
          tilt={wave(frame, 28) * 3}
          style={{
            position: "absolute",
            left: 1240,
            top: 330,
            scale: "1.08",
            transformOrigin: "50% 100%",
            translate: `${(1 - enter) * 640}px 0px`,
          }}
        />
        <div style={{ position: "absolute", left: 120, top: 250, zIndex: 10 }}>
          <div
            style={{
              fontFamily: F.sans,
              fontWeight: 800,
              fontSize: 150,
              lineHeight: 1,
              letterSpacing: "-0.045em",
              color: C.paper,
            }}
          >
            <Word at={cue("statement.w1")}>Stick</Word> <Word at={cue("statement.w2")}>your</Word>
          </div>
          <Accent
            text="vibe"
            at={cue("statement.accent")}
            color={C.yellow}
            size={290}
            underline={{ at: cue("statement.underline"), color: C.orange }}
            dot={{ color: C.yellow, wipe: { start: wipeStart, end: wipeEnd, to: C.paper } }}
            style={{ marginTop: -14 }}
          />
          <Eyebrow
            at={cue("statement.sub")}
            color={C.yellow}
            style={{ marginTop: 34, fontSize: 30, opacity: interpolate(frame, [cue("statement.sub"), cue("statement.sub") + 10], [0, 1], CLAMP) }}
          >
            {"// on your walls · desk · room"}
          </Eyebrow>
        </div>
      </Camera>
      <Hud label="// 05 — your space" dark />
    </AbsoluteFill>
  );
};
