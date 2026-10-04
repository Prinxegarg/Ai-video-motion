import { interpolate, useCurrentFrame } from "remotion";
import { CLAMP, EASE, progress } from "../lib/animation";
import { useUnit } from "../lib/layout";

type AnimatedTextProps = {
  readonly text: string;
  /** Animate word by word or character by character. */
  readonly by?: "word" | "char";
  /** Frame at which the first token starts animating. */
  readonly delay?: number;
  /** Frames between consecutive tokens. */
  readonly stagger?: number;
  /** Frames each token takes to settle. */
  readonly duration?: number;
  /** Upward travel in design pixels (1920×1080). */
  readonly distance?: number;
  /** Starting blur in design pixels. 0 disables the blur. */
  readonly blur?: number;
  readonly style?: React.CSSProperties;
};

/**
 * Staggered text reveal: each word (or character) rises, sharpens and fades in.
 * Words never break across lines in "char" mode.
 *
 *   <AnimatedText text="Hello world" by="char" delay={10} stagger={2} />
 */
export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  by = "word",
  delay = 0,
  stagger = 3,
  duration = 18,
  distance = 40,
  blur = 12,
  style,
}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const words = text.split(" ");
  let tokenIndex = 0;

  const tokenStyle = (index: number): React.CSSProperties => {
    const p = progress(frame, delay + index * stagger, duration, EASE.out);
    return {
      display: "inline-block",
      whiteSpace: "pre",
      opacity: interpolate(p, [0, 0.6], [0, 1], CLAMP),
      translate: `0px ${(1 - p) * u(distance)}px`,
      filter: blur > 0 ? `blur(${(1 - p) * u(blur)}px)` : undefined,
    };
  };

  return (
    <div style={style}>
      {words.map((word, w) => (
        <span key={w}>
          {by === "word" ? (
            <span style={tokenStyle(tokenIndex++)}>{word}</span>
          ) : (
            <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {Array.from(word).map((char, c) => (
                <span key={c} style={tokenStyle(tokenIndex++)}>
                  {char}
                </span>
              ))}
            </span>
          )}
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </div>
  );
};
