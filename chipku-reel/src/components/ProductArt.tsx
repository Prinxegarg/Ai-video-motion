import { useId } from "react";
import { Img } from "remotion";
import { ASSETS } from "../assets";
import { C, F } from "../theme";

export type Category = "sports" | "cars" | "music" | "motivation" | "trending";

const Dots: React.FC<{ readonly id: string; readonly color?: string; readonly r?: number }> = ({
  id,
  color = C.black,
  r = 2.2,
}) => (
  <pattern id={id} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <circle cx="4.5" cy="4.5" r={r} fill={color} />
  </pattern>
);

/**
 * Original category illustrations, drawn only in the Chipku palette.
 * viewBox 300×300; `label` adds the category title in Anton.
 */
export const CategoryArt: React.FC<{
  readonly kind: Category;
  readonly label?: boolean;
  readonly style?: React.CSSProperties;
}> = ({ kind, label = true, style }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const dots = `dots-${uid}`;
  const title = (text: string, fill: string, y = 282, size = 46) =>
    label ? (
      <text
        x="150"
        y={y}
        textAnchor="middle"
        fontFamily={F.display}
        fontSize={size}
        letterSpacing="1"
        fill={fill}
      >
        {text}
      </text>
    ) : null;

  return (
    <svg viewBox="0 0 300 300" style={{ display: "block", width: "100%", height: "100%", ...style }}>
      <defs>
        <Dots id={dots} />
      </defs>
      {kind === "sports" ? (
        <g>
          <rect width="300" height="300" fill={C.ink} />
          {[70, 100, 130].map((y) => (
            <path key={y} d={`M20 ${y} L 70 ${y}`} stroke={C.yellow} strokeWidth="8" strokeLinecap="round" />
          ))}
          <circle cx="160" cy="128" r="88" fill={C.orange} stroke={C.black} strokeWidth="8" />
          <path d="M160 128 L 248 128 A 88 88 0 0 1 160 216 Z" fill={`url(#${dots})`} opacity="0.35" />
          <path d="M160 40 L 160 216 M 72 128 L 248 128" stroke={C.black} strokeWidth="7" />
          <path d="M100 60 C 130 100, 130 156, 100 196 M 220 60 C 190 100, 190 156, 220 196" stroke={C.black} strokeWidth="7" fill="none" />
          <path d="M112 70 C 120 64, 132 60, 144 58" stroke={C.yellow} strokeWidth="7" strokeLinecap="round" fill="none" />
          {title("SPORTS", C.yellow)}
        </g>
      ) : null}
      {kind === "cars" ? (
        <g>
          <rect width="300" height="300" fill={C.yellow} />
          <circle cx="190" cy="112" r="62" fill={C.orange} />
          <circle cx="190" cy="112" r="62" fill={`url(#${dots})`} opacity="0.25" />
          <rect x="0" y="206" width="300" height="94" fill={C.black} />
          <path d="M20 232 L 70 232 M 120 232 L 170 232 M 220 232 L 270 232" stroke={C.yellow} strokeWidth="6" />
          {[150, 166, 182].map((y, i) => (
            <path key={y} d={`M${8 + i * 6} ${y} L ${44 + i * 6} ${y}`} stroke={C.black} strokeWidth="6" strokeLinecap="round" />
          ))}
          <path
            d="M44 196 L 62 168 C 92 146, 122 136, 152 136 L 190 136 C 214 136, 234 152, 250 166 L 272 172 C 282 174, 288 182, 288 192 L 288 200 L 44 200 Z"
            fill={C.black}
            stroke={C.black}
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M108 160 L 130 146 L 176 146 L 196 166 Z" fill={C.paper} />
          <path d="M62 184 L 282 184" stroke={C.orange} strokeWidth="6" />
          {[96, 238].map((x) => (
            <g key={x}>
              <circle cx={x} cy="204" r="25" fill={C.black} stroke={C.yellow} strokeWidth="5" />
              <circle cx={x} cy="204" r="9" fill={C.paper} />
            </g>
          ))}
          {title("CARS", C.yellow, 282)}
        </g>
      ) : null}
      {kind === "music" ? (
        <g>
          <rect width="300" height="300" fill={C.orange} />
          <circle cx="150" cy="128" r="100" fill={C.black} />
          {[86, 74, 62, 50].map((r) => (
            <circle key={r} cx="150" cy="128" r={r} fill="none" stroke="#2A2A2A" strokeWidth="3" />
          ))}
          <path d="M86 70 A 88 88 0 0 1 150 40" stroke={C.paper} strokeOpacity="0.35" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="150" cy="128" r="34" fill={C.yellow} />
          <circle cx="150" cy="128" r="6" fill={C.black} />
          <g fill={C.black}>
            <ellipse cx="248" cy="232" rx="16" ry="12" />
            <rect x="259" y="170" width="7" height="62" />
            <path d="M266 170 Q 286 178 284 200 Q 278 186 266 186 Z" />
            <ellipse cx="42" cy="240" rx="13" ry="10" />
            <rect x="51" y="192" width="6" height="48" />
          </g>
          {title("MUSIC", C.black)}
        </g>
      ) : null}
      {kind === "motivation" ? (
        <g>
          <rect width="300" height="300" fill={C.paper} />
          <rect x="44" y="134" width="212" height="92" fill={C.yellow} />
          <text x="150" y="124" textAnchor="middle" fontFamily={F.display} fontSize="92" fill={C.black}>
            DREAM
          </text>
          <text x="150" y="220" textAnchor="middle" fontFamily={F.display} fontSize="104" fill={C.black}>
            BIG
          </text>
          <polygon points="262,8 238,52 254,52 242,92 280,40 262,40 276,8" fill={C.orange} stroke={C.black} strokeWidth="5" strokeLinejoin="round" />
          {title("MOTIVATION", C.black, 280, 34)}
        </g>
      ) : null}
      {kind === "trending" ? (
        <g>
          <rect width="300" height="300" fill={C.ink} />
          <path
            d="M150 34 C 176 84, 234 108, 220 182 C 212 228, 182 248, 150 248 C 116 248, 82 228, 80 184 C 78 140, 108 122, 118 84 C 130 112, 144 118, 150 34 Z"
            fill={C.orange}
            stroke={C.black}
            strokeWidth="6"
          />
          <path
            d="M150 120 C 166 150, 196 162, 188 202 C 184 226, 168 236, 150 236 C 130 236, 114 224, 112 200 C 110 176, 128 166, 134 146 C 140 160, 146 162, 150 120 Z"
            fill={C.yellow}
          />
          <path d="M80 184 C 78 140, 108 122, 118 84" stroke={C.paper} strokeOpacity="0.35" strokeWidth="6" fill="none" />
          {title("TRENDING", C.yellow, 284, 40)}
        </g>
      ) : null}
    </svg>
  );
};

const SHADOW = "0 18px 40px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.18)";

const POSTER_TITLES: Record<Category, string> = {
  sports: "SPORTS",
  cars: "CARS",
  music: "MUSIC",
  motivation: "MOTIVATION",
  trending: "TRENDING",
};

/** Wall poster: square art over a printed title band, paper border + washi tape. */
export const Poster: React.FC<{
  readonly kind: Category;
  readonly width: number;
  readonly tape?: boolean;
  readonly style?: React.CSSProperties;
}> = ({ kind, width, tape = true, style }) => {
  const pad = width * 0.05;
  return (
    <div
      style={{
        position: "relative",
        width,
        backgroundColor: C.paper,
        padding: `${pad}px ${pad}px 0`,
        boxShadow: SHADOW,
        ...style,
      }}
    >
      <div style={{ width: width - pad * 2, height: width - pad * 2, overflow: "hidden" }}>
        <CategoryArt kind={kind} label={false} />
      </div>
      <div
        style={{
          height: width * 0.3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.display,
          fontSize: width * (kind === "motivation" ? 0.13 : 0.17),
          letterSpacing: "0.02em",
          color: C.black,
        }}
      >
        {POSTER_TITLES[kind]}
      </div>
      {tape ? (
        <div
          style={{
            position: "absolute",
            top: -width * 0.05,
            left: "50%",
            width: width * 0.36,
            height: width * 0.1,
            translate: "-50% 0",
            rotate: "-4deg",
            backgroundColor: C.yellow,
            opacity: 0.88,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}
        />
      ) : null}
    </div>
  );
};

/** Polaroid: white frame with a deep bottom edge and a handwritten caption. */
export const Polaroid: React.FC<{
  readonly kind: Category;
  readonly width: number;
  readonly caption?: string;
  readonly style?: React.CSSProperties;
}> = ({ kind, width, caption, style }) => {
  const pad = width * 0.06;
  return (
    <div
      style={{
        width,
        backgroundColor: C.white,
        padding: `${pad}px ${pad}px 0`,
        boxShadow: SHADOW,
        ...style,
      }}
    >
      <div style={{ width: width - pad * 2, height: width - pad * 2, overflow: "hidden" }}>
        <CategoryArt kind={kind} label={false} />
      </div>
      <div
        style={{
          height: width * 0.24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.serif,
          fontStyle: "italic",
          fontSize: width * 0.13,
          color: C.black,
        }}
      >
        {caption ?? kind}
      </div>
    </div>
  );
};

/** Die-cut sticker: thick white border following the shape + soft shadow. */
export const Sticker: React.FC<{
  readonly kind: Category | "logo";
  readonly size: number;
  readonly style?: React.CSSProperties;
}> = ({ kind, size, style }) => {
  const border = Math.max(4, size * 0.035);
  const outline = [
    `drop-shadow(${border}px 0 0 ${C.white})`,
    `drop-shadow(-${border}px 0 0 ${C.white})`,
    `drop-shadow(0 ${border}px 0 ${C.white})`,
    `drop-shadow(0 -${border}px 0 ${C.white})`,
    "drop-shadow(0 14px 18px rgba(0,0,0,0.3))",
  ].join(" ");

  if (kind === "logo") {
    return (
      <div style={{ width: size, height: size, filter: outline, ...style }}>
        <Img src={ASSETS.logoInitial} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, filter: outline, ...style }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: kind === "trending" ? 0 : "50%",
          overflow: kind === "trending" ? "visible" : "hidden",
        }}
      >
        {kind === "trending" ? (
          <svg viewBox="0 0 300 300" style={{ width: "100%", height: "100%", display: "block" }}>
            <path
              d="M150 24 C 180 80, 240 104, 226 186 C 216 238, 184 262, 150 262 C 112 262, 76 240, 72 190 C 70 140, 102 118, 112 78 C 126 108, 142 114, 150 24 Z"
              fill={C.orange}
              stroke={C.black}
              strokeWidth="9"
            />
            <path
              d="M150 116 C 168 150, 202 164, 194 208 C 190 234, 172 246, 150 246 C 128 246, 110 232, 108 206 C 106 180, 126 168, 132 146 C 140 162, 146 164, 150 116 Z"
              fill={C.yellow}
            />
          </svg>
        ) : (
          <CategoryArt kind={kind} label={false} style={{ scale: "1.12" }} />
        )}
      </div>
    </div>
  );
};
