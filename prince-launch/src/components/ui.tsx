import { C, F } from "../theme";

/** Frosted dark glass panel with a hairline border and a top highlight. */
export const glass = (radius = 28): React.CSSProperties => ({
  position: "relative",
  borderRadius: radius,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, rgba(26,26,26,0.55) 100%)",
  border: `1px solid ${C.line}`,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.12), 0 40px 80px rgba(0,0,0,0.55)",
  backdropFilter: "blur(22px)",
  overflow: "hidden",
});

/** Line of text revealed by sliding up out of a mask. p: 0 → 1. */
export const Mask: React.FC<{
  readonly p: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
  readonly from?: number;
}> = ({ p, children, style, from = 105 }) => (
  <div style={{ overflow: "hidden", paddingBottom: "0.08em", ...style }}>
    <div style={{ translate: `0px ${(1 - p) * from}%` }}>{children}</div>
  </div>
);

/** Four-point sparkle, the universal "AI" mark. */
export const Sparkle: React.FC<{
  readonly size: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
}> = ({ size, color = C.lime, style }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={style}>
    <path
      d="M0 -48 C6 -14 14 -6 48 0 C14 6 6 14 0 48 C-6 14 -14 6 -48 0 C-14 -6 -6 -14 0 -48 Z"
      fill={color}
    />
  </svg>
);

/** Generic camera glyph used next to Instagram handles. */
export const CameraGlyph: React.FC<{
  readonly size: number;
  readonly color?: string;
}> = ({ size, color = C.white }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <rect
      x={4}
      y={4}
      width={40}
      height={40}
      rx={12}
      fill="none"
      stroke={color}
      strokeWidth={4}
    />
    <circle cx={24} cy={24} r={9} fill="none" stroke={color} strokeWidth={4} />
    <circle cx={35} cy={13} r={2.6} fill={color} />
  </svg>
);

/** Rounded pill chip. */
export const Chip: React.FC<{
  readonly children: React.ReactNode;
  readonly accent?: boolean;
  readonly style?: React.CSSProperties;
}> = ({ children, accent, style }) => (
  <div
    style={{
      ...glass(999),
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 24px",
      fontFamily: F.ui,
      fontWeight: 600,
      fontSize: 22,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: accent ? C.bg : C.white,
      background: accent ? C.lime : undefined,
      border: accent ? "none" : `1px solid ${C.line}`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** 10_000_000 → "10M", 250_000 → "250K", 1_234_000 → "1.2M". */
export const compact = (n: number): string => {
  if (n >= 1e6)
    return `${n >= 1e7 ? Math.floor(n / 1e6) : Math.floor(n / 1e5) / 10}M`;
  if (n >= 1e3) return `${Math.floor(n / 1e3)}K`;
  return `${Math.floor(n)}`;
};
