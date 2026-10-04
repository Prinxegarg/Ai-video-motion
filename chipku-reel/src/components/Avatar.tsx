import { useId } from "react";
import { Img, staticFile } from "remotion";
import { C } from "../theme";

/** Warm off-white used for skin — a tint inside the brand's off-white family. */
const SKIN = "#FFF4DE";
const OUTLINE = 10;

export type AvatarProps = {
  /** 0 = eyes open, 1 = closed. */
  readonly blink?: number;
  /** Right eye closes into a happy wink (0..1). */
  readonly wink?: number;
  /** 0 = closed smile, 1 = open grin. */
  readonly grin?: number;
  /** Eye direction, -1..1. */
  readonly lookX?: number;
  readonly lookY?: number;
  /** Head tilt in degrees (pivot at the neck). */
  readonly tilt?: number;
  /** Eyebrow lift, 0..1. */
  readonly brows?: number;
  /** Show hoodie + shoulders (false for a head-only peek). */
  readonly body?: boolean;
  /** Raised arm angle in degrees, or null for no raised arm. */
  readonly arm?: number | null;
  readonly style?: React.CSSProperties;
};

/**
 * "Chipku kid" — an original mascot drawn in the logo's visual language:
 * thick black comic outlines, sharp spiky shapes, the logo's yellow→orange
 * two-tone split, plus halftone-dot shading inspired by the reference video.
 * The supplied CHIPKU initial logo is worn unaltered as a chest patch.
 * viewBox is 600×720 (bust). Everything is driven by props → frame.
 */
export const Avatar: React.FC<AvatarProps> = ({
  blink = 0,
  wink = 0,
  grin = 0,
  lookX = 0,
  lookY = 0,
  tilt = 0,
  brows = 0,
  body = true,
  arm = null,
  style,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const eyeScale = Math.max(0.08, 1 - blink);
  const ex = lookX * 9;
  const ey = lookY * 7;
  const browLift = -brows * 12;

  return (
    <div style={{ position: "relative", width: 600, height: 720, ...style }}>
      <svg
        viewBox="0 0 600 720"
        width={600}
        height={720}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          <pattern
            id={id("dots")}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <circle cx="5" cy="5" r="2.3" fill={C.black} />
          </pattern>
          <linearGradient id={id("faceShade")} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id={id("faceMask")} maskUnits="userSpaceOnUse">
            <rect x="160" y="130" width="290" height="360" fill={`url(#${id("faceShade")})`} />
          </mask>
          <clipPath id={id("headClip")}>
            <path d={HEAD} />
          </clipPath>
          <clipPath id={id("bodyClip")}>
            <path d={BODY} />
          </clipPath>
          <clipPath id={id("mouthClip")}>
            <path d={GRIN} />
          </clipPath>
        </defs>

        {body ? (
          <g>
            {/* Hoodie with the logo's two-tone split and gloss bevel */}
            <path d={BODY} fill={C.yellow} />
            <g clipPath={`url(#${id("bodyClip")})`}>
              <polygon points="0,655 600,600 600,720 0,720" fill={C.orange} />
              <polygon points="0,700 600,668 600,720 0,720" fill={C.ember} opacity={0.55} />
              <path
                d="M70 640 C 82 590, 130 560, 205 548"
                stroke={C.paper}
                strokeOpacity={0.55}
                strokeWidth={12}
                strokeLinecap="round"
                fill="none"
              />
              <rect x="300" y="520" width="300" height="200" fill={`url(#${id("dots")})`} opacity={0.22} />
            </g>
            <path d={BODY} fill="none" stroke={C.black} strokeWidth={OUTLINE} strokeLinejoin="round" />
            {/* Neck */}
            <rect x="262" y="430" width="76" height="110" rx="20" fill={SKIN} stroke={C.black} strokeWidth={OUTLINE} />
            <rect x="262" y="440" width="76" height="60" fill={`url(#${id("dots")})`} opacity={0.35} />
            {/* Hood collar */}
            <path
              d="M196 530 C 222 600, 378 600, 404 530 C 380 556, 220 556, 196 530 Z"
              fill={C.orange}
              stroke={C.black}
              strokeWidth={OUTLINE}
              strokeLinejoin="round"
            />
            {/* Strings */}
            <path d="M268 572 L 258 650" stroke={C.black} strokeWidth={8} strokeLinecap="round" />
            <path d="M332 572 L 342 650" stroke={C.black} strokeWidth={8} strokeLinecap="round" />
            <rect x="249" y="646" width="18" height="24" rx="5" fill={C.paper} stroke={C.black} strokeWidth={5} />
            <rect x="333" y="646" width="18" height="24" rx="5" fill={C.paper} stroke={C.black} strokeWidth={5} />
          </g>
        ) : null}

        <g transform={`rotate(${tilt} 300 470)`}>
          {/* Ears */}
          <circle cx="164" cy="345" r="34" fill={SKIN} stroke={C.black} strokeWidth={OUTLINE} />
          <circle cx="436" cy="345" r="34" fill={SKIN} stroke={C.black} strokeWidth={OUTLINE} />
          <path d="M156 335 Q 170 348 158 362" stroke={C.black} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M444 335 Q 430 348 442 362" stroke={C.black} strokeWidth={6} fill="none" strokeLinecap="round" />

          {/* Head + halftone shading */}
          <path d={HEAD} fill={SKIN} />
          <g clipPath={`url(#${id("headClip")})`}>
            <rect
              x="160"
              y="130"
              width="290"
              height="360"
              fill={`url(#${id("dots")})`}
              mask={`url(#${id("faceMask")})`}
              opacity={0.42}
            />
            {/* Shadow cast by the hair */}
            <path d={HAIR} transform="translate(6 26)" fill={`url(#${id("dots")})`} opacity={0.45} />
          </g>
          <path d={HEAD} fill="none" stroke={C.black} strokeWidth={OUTLINE} strokeLinejoin="round" />

          {/* Cheeks */}
          <ellipse cx="206" cy="402" rx="27" ry="14" fill={C.orange} opacity={0.75} />
          <ellipse cx="394" cy="402" rx="27" ry="14" fill={C.orange} opacity={0.75} />

          {/* Brows */}
          <g transform={`translate(0 ${browLift})`}>
            <path d="M212 290 Q 240 276 268 286" stroke={C.black} strokeWidth={12} strokeLinecap="round" fill="none" />
            <path d="M332 286 Q 360 276 388 290" stroke={C.black} strokeWidth={12} strokeLinecap="round" fill="none" />
          </g>

          {/* Eyes */}
          <g transform={`translate(${ex} ${ey})`}>
            <g transform={`translate(245 343) scale(1 ${eyeScale}) translate(-245 -343)`}>
              <ellipse cx="245" cy="343" rx="24" ry="32" fill={C.black} />
              <circle cx="253" cy="331" r="7.5" fill={C.white} />
              <circle cx="238" cy="355" r="3.2" fill={C.white} />
            </g>
            <g opacity={1 - wink}>
              <g transform={`translate(355 343) scale(1 ${eyeScale}) translate(-355 -343)`}>
                <ellipse cx="355" cy="343" rx="24" ry="32" fill={C.black} />
                <circle cx="363" cy="331" r="7.5" fill={C.white} />
                <circle cx="348" cy="355" r="3.2" fill={C.white} />
              </g>
            </g>
            <path
              d="M330 350 Q 355 322 380 350"
              stroke={C.black}
              strokeWidth={11}
              strokeLinecap="round"
              fill="none"
              opacity={wink}
            />
          </g>

          {/* Nose */}
          <path d="M300 372 Q 308 384 297 390" stroke={C.black} strokeWidth={6} strokeLinecap="round" fill="none" />

          {/* Mouth: smile ⇄ open grin */}
          <path d="M262 420 Q 300 454 338 420" stroke={C.black} strokeWidth={10} strokeLinecap="round" fill="none" opacity={1 - grin} />
          <g opacity={grin}>
            <path d={GRIN} fill={C.black} />
            <g clipPath={`url(#${id("mouthClip")})`}>
              <rect x="250" y="410" width="100" height="14" fill={C.white} />
              <ellipse cx="300" cy="466" rx="24" ry="13" fill={C.ember} />
            </g>
            <path d={GRIN} fill="none" stroke={C.black} strokeWidth={8} strokeLinejoin="round" />
          </g>

          {/* Spiky hair — echoes the logo's sharp spikes, with its grey bevels */}
          <path d={HAIR} fill={C.black} stroke={C.black} strokeWidth={6} strokeLinejoin="round" />
          <path d="M214 112 L 236 150 M 292 76 L 306 126 M 372 92 L 368 142 M 156 150 L 190 178" stroke="#3A3A3A" strokeWidth={6} strokeLinecap="round" />
        </g>

        {arm !== null ? (
          <g transform={`rotate(${arm} 120 600)`}>
            {/* Sleeve: outline stroke under fill stroke */}
            <path d="M120 600 L 92 420" stroke={C.black} strokeWidth={92} strokeLinecap="round" />
            <path d="M120 600 L 92 420" stroke={C.yellow} strokeWidth={72} strokeLinecap="round" />
            <path d="M118 585 L 104 500" stroke={C.orange} strokeWidth={40} strokeLinecap="round" opacity={0.6} />
            {/* Hand (open palm) */}
            <g transform="translate(88 360)">
              <path d={HAND} fill={SKIN} stroke={C.black} strokeWidth={9} strokeLinejoin="round" />
              <path d="M-14 -18 L -16 -44 M 4 -22 L 4 -50 M 22 -18 L 24 -42" stroke={C.black} strokeWidth={5} strokeLinecap="round" />
            </g>
          </g>
        ) : null}
      </svg>

      {body ? (
        <Img
          src={staticFile("brand/chipku-logo-initial.png")}
          style={{
            position: "absolute",
            left: 372,
            top: 590,
            width: 78,
            rotate: "-6deg",
          }}
        />
      ) : null}
    </div>
  );
};

const HEAD =
  "M168 262 C 168 176, 232 138, 300 138 C 368 138, 432 176, 432 262 L 434 362 C 434 442, 380 482, 300 482 C 220 482, 166 442, 166 362 Z";

const HAIR =
  "M160 306 L 150 238 L 112 222 L 158 192 L 140 136 L 200 156 L 206 92 L 258 134 L 292 62 L 324 124 L 382 80 L 386 142 L 450 118 L 436 182 L 486 204 L 444 236 L 446 306 L 424 262 L 404 286 L 384 246 L 354 272 L 334 236 L 302 266 L 282 232 L 252 262 L 238 230 L 208 262 L 196 236 Z";

const BODY =
  "M38 720 L 50 642 C 60 578, 120 542, 205 528 L 395 528 C 480 542, 540 578, 550 642 L 562 720 Z";

const GRIN = "M256 414 Q 300 420 344 414 Q 338 476 300 478 Q 262 476 256 414 Z";

const HAND =
  "M-38 40 C -48 10, -44 -20, -30 -40 C -24 -58, -8 -60, -4 -46 C 0 -64, 18 -64, 20 -46 C 28 -58, 44 -52, 40 -30 C 52 -26, 54 -4, 44 14 C 38 34, 20 50, 0 52 C -18 54, -32 52, -38 40 Z";
