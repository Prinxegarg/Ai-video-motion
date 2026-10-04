import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { Avatar } from "../components/Avatar";
import { Hud } from "../components/Chrome";
import { Polaroid, Sticker } from "../components/ProductArt";
import { useAbsFrame } from "../components/Scene";
import { Camera, Bg } from "../components/Transitions";
import { Accent, Eyebrow, Word } from "../components/Type";
import { CLAMP, cue, transitionRange, wave } from "../lib/motion";
import { C, F } from "../theme";

/** Beat 1a — hook: "Make your room look like you." with the mascot. */
export const HookScene: React.FC = () => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const [wipeStart, wipeEnd] = transitionRange("circleToYellow");

  const rise = spring({ frame: frame - cue("hook.avatar"), fps, config: { damping: 14, stiffness: 120 } });
  const winkAt = cue("hook.wink");
  const wink = interpolate(frame, [winkAt, winkAt + 3, winkAt + 14, winkAt + 18], [0, 1, 1, 0], CLAMP);
  const blink = interpolate(frame, [38, 40, 43], [0, 1, 0], CLAMP);
  const grin = interpolate(frame, [cue("hook.accent") - 2, cue("hook.accent") + 4], [0, 1], CLAMP);
  const look = interpolate(frame, [cue("hook.w1"), cue("hook.w1") + 8], [0, -1], CLAMP);

  const item = (id: "hook.item1" | "hook.item2" | "hook.item3") =>
    spring({ frame: frame - cue(id), fps, config: { damping: 10, stiffness: 150 } });

  return (
    <AbsoluteFill>
      <Bg color={C.paper} />
      <Camera start={0} end={wipeEnd} to={1.04} origin="70% 60%">
        {/* Floating mini products around the mascot */}
        <div
          style={{
            position: "absolute",
            left: 1110,
            top: 150,
            scale: `${item("hook.item1") * 0.95}`,
            rotate: `${-12 + wave(frame, 70) * 4}deg`,
            translate: `0px ${wave(frame, 50, 1) * 10}px`,
          }}
        >
          <Polaroid kind="cars" width={190} caption="my ride" />
        </div>
        <div
          style={{
            position: "absolute",
            left: 1720,
            top: 170,
            scale: `${item("hook.item2")}`,
            rotate: `${14 + wave(frame, 64, 2) * 5}deg`,
            translate: `0px ${wave(frame, 46, 2) * 10}px`,
          }}
        >
          <Sticker kind="logo" size={150} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 1760,
            top: 560,
            scale: `${item("hook.item3")}`,
            rotate: `${-8 + wave(frame, 58, 3) * 5}deg`,
            translate: `0px ${wave(frame, 52, 4) * 10}px`,
          }}
        >
          <Sticker kind="trending" size={130} />
        </div>

        {/* Mascot bust (reference: big character on the right) */}
        <Avatar
          blink={blink}
          wink={wink}
          grin={grin}
          lookX={look}
          lookY={-0.2}
          tilt={interpolate(rise, [0, 1], [12, -3]) + wave(frame, 80) * 2}
          brows={grin * 0.8}
          style={{
            position: "absolute",
            left: 1180,
            top: 330,
            scale: "1.1",
            transformOrigin: "50% 100%",
            translate: `0px ${(1 - rise) * 520 + wave(frame, 45) * 5}px`,
          }}
        />

        {/* Headline block */}
        <div style={{ position: "absolute", left: 120, top: 210, zIndex: 10 }}>
          <Eyebrow at={cue("hook.eyebrow")} color="rgba(0,0,0,0.55)">
            {"// posters · polaroids · stickers"}
          </Eyebrow>
          <div
            style={{
              marginTop: 26,
              fontFamily: F.sans,
              fontWeight: 700,
              fontSize: 132,
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
              color: C.black,
            }}
          >
            <div>
              <Word at={cue("hook.w1")}>Make</Word> <Word at={cue("hook.w2")}>your</Word>{" "}
              <Word at={cue("hook.w3")}>room</Word>
            </div>
            <div>
              <Word at={cue("hook.w4")}>look</Word> <Word at={cue("hook.w5")}>like</Word>
            </div>
          </div>
          <Accent
            text="you"
            at={cue("hook.accent")}
            color={C.ember}
            size={250}
            underline={{ at: cue("hook.underline"), color: C.ember }}
            dot={{ color: C.ember, wipe: { start: wipeStart, end: wipeEnd, to: C.yellow } }}
            style={{ marginTop: -18 }}
          />
        </div>
      </Camera>
      <Hud label="// 01 — hello" />
    </AbsoluteFill>
  );
};
