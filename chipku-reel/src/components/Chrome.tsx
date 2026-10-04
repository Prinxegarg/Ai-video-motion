import { AbsoluteFill, Img, interpolate, random, spring, useVideoConfig } from "remotion";
import { ASSETS } from "../assets";
import { CLAMP, EASE, prog, timecode } from "../lib/motion";
import { C, F } from "../theme";
import { Avatar, type AvatarProps } from "./Avatar";
import { useAbsFrame } from "./Scene";

/** Reference-style HUD: "// 0N — section" top-left, brand + running timecode top-right. */
export const Hud: React.FC<{ readonly label: string; readonly dark?: boolean }> = ({ label, dark = false }) => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const color = dark ? "rgba(250,246,236,0.62)" : "rgba(0,0,0,0.55)";
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: F.mono, fontSize: 20, color }}>
      <div style={{ position: "absolute", left: 44, top: 34 }}>{label}</div>
      <div style={{ position: "absolute", right: 44, top: 34, display: "flex", gap: 22 }}>
        <span>CHIPKU</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{timecode(frame, fps)}</span>
      </div>
    </AbsoluteFill>
  );
};

/** Four-point sparkle ✨ in brand colours. */
export const Sparkle: React.FC<{ readonly size: number; readonly color?: string; readonly style?: React.CSSProperties }> = ({
  size,
  color = C.yellow,
  style,
}) => (
  <svg viewBox="-50 -50 100 100" width={size} height={size} style={{ overflow: "visible", ...style }}>
    <path d="M0 -48 C 6 -12, 12 -6, 48 0 C 12 6, 6 12, 0 48 C -6 12, -12 6, -48 0 C -12 -6, -6 -12, 0 -48 Z" fill={color} />
  </svg>
);

/** Burst of sparkles that fly out from a point (used on clicks and offers). */
export const SparkleBurst: React.FC<{ readonly at: number; readonly count?: number; readonly radius?: number; readonly seed?: string }> = ({
  at,
  count = 8,
  radius = 160,
  seed = "burst",
}) => {
  const frame = useAbsFrame();
  const t = frame - at;
  if (t < 0 || t > 26) return null;
  const p = prog(frame, at, 22, EASE.out);
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const ang = (i / count) * Math.PI * 2 + random(`${seed}-a-${i}`) * 0.6;
        const dist = radius * (0.6 + random(`${seed}-d-${i}`) * 0.5) * p;
        const size = 22 + random(`${seed}-s-${i}`) * 26;
        return (
          <Sparkle
            key={i}
            size={size}
            color={i % 3 === 0 ? C.orange : C.yellow}
            style={{
              position: "absolute",
              left: Math.cos(ang) * dist - size / 2,
              top: Math.sin(ang) * dist - size / 2,
              opacity: interpolate(t, [0, 4, 18, 26], [0, 1, 1, 0], CLAMP),
              scale: `${interpolate(p, [0, 0.3, 1], [0.2, 1.1, 0.6], CLAMP)}`,
              rotate: `${p * 90}deg`,
            }}
          />
        );
      })}
    </>
  );
};

/** macOS-style pointer (black fill, white outline) with click ripple. */
export const Cursor: React.FC<{
  readonly path: { frame: number; x: number; y: number }[];
  readonly clickAt: number;
  readonly ringColor?: string;
}> = ({ path, clickAt, ringColor = C.orange }) => {
  const frame = useAbsFrame();
  const frames = path.map((p) => p.frame);
  const x = interpolate(frame, frames, path.map((p) => p.x), { ...CLAMP, easing: EASE.inOut });
  const y = interpolate(frame, frames, path.map((p) => p.y), { ...CLAMP, easing: EASE.inOut });
  if (frame < path[0].frame) return null;
  const press = interpolate(frame, [clickAt - 3, clickAt, clickAt + 4], [1, 0.82, 1], CLAMP);
  const ring = prog(frame, clickAt, 16, EASE.out);
  return (
    <div style={{ position: "absolute", left: x, top: y, zIndex: 80 }}>
      {frame >= clickAt ? (
        <div
          style={{
            position: "absolute",
            left: -70,
            top: -70,
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: `5px solid ${ringColor}`,
            scale: `${0.2 + ring * 0.9}`,
            opacity: 1 - ring,
          }}
        />
      ) : null}
      <svg width="52" height="60" viewBox="0 0 26 30" style={{ scale: `${press}`, transformOrigin: "0 0", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}>
        <path d="M2 2 L 2 24 L 8 18.5 L 12 27 L 16 25.2 L 12 16.8 L 20 16.8 Z" fill={C.black} stroke={C.white} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** The avatar inside a round badge with a coloured ring (reference's corner badge). */
export const AvatarBadge: React.FC<{
  readonly at: number;
  readonly ring: string;
  readonly face?: AvatarProps;
  readonly style?: React.CSSProperties;
}> = ({ at, ring, face, style }) => {
  const frame = useAbsFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 160 } });
  const size = 200;
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        scale: `${s}`,
        rotate: `${(1 - s) * -30}deg`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -12,
          borderRadius: "50%",
          border: `6px solid ${ring}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: C.paper,
          border: `5px solid ${C.black}`,
        }}
      >
        <Avatar {...face} style={{ position: "absolute", left: -110, top: -70, scale: "0.62", transformOrigin: "0 0" }} />
      </div>
    </div>
  );
};

/** Instagram-style camera glyph, drawn as simple outline shapes. */
export const InstaGlyph: React.FC<{ readonly size: number; readonly color: string }> = ({ size, color }) => (
  <svg viewBox="0 0 48 48" width={size} height={size}>
    <rect x="4" y="4" width="40" height="40" rx="12" fill="none" stroke={color} strokeWidth="4.5" />
    <circle cx="24" cy="24" r="9.5" fill="none" stroke={color} strokeWidth="4.5" />
    <circle cx="35" cy="13" r="3" fill={color} />
  </svg>
);

/** Full logo, slapped on like a sticker: drops in large, lands with squash. Never distorted. */
export const LogoSlap: React.FC<{
  readonly at: number;
  readonly land: number;
  readonly width: number;
  readonly src?: string;
  readonly style?: React.CSSProperties;
}> = ({ at, land, width, src = ASSETS.logoFull, style }) => {
  const frame = useAbsFrame();
  const drop = prog(frame, at, land - at, EASE.in);
  const settle = interpolate(frame, [land, land + 3, land + 7, land + 12], [0.94, 1.03, 0.99, 1], CLAMP);
  const scale = frame < land ? interpolate(drop, [0, 1], [1.8, 0.94]) : settle;
  return (
    <Img
      src={src}
      style={{
        width,
        height: "auto",
        opacity: interpolate(frame, [at, at + 2], [0, 1], CLAMP),
        scale: `${scale}`,
        rotate: `${interpolate(drop, [0, 1], [-10, 0])}deg`,
        filter: `drop-shadow(0 ${interpolate(drop, [0, 1], [40, 10])}px ${interpolate(drop, [0, 1], [40, 12])}px rgba(0,0,0,0.25))`,
        ...style,
      }}
    />
  );
};

/** Subtle paper grain over the whole frame (print feel), tiled with <Img> so it is always loaded. */
export const Grain: React.FC = () => {
  const tile = 512;
  const cols = Math.ceil(1920 / tile);
  const rows = Math.ceil(1080 / tile);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.07 }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <Img
          key={i}
          src={ASSETS.grain}
          style={{ position: "absolute", left: (i % cols) * tile, top: Math.floor(i / cols) * tile, width: tile, height: tile }}
        />
      ))}
    </AbsoluteFill>
  );
};
