import { AbsoluteFill, Img, staticFile } from "remotion";

/** Static film grain + edge vignette that unify every section. */
export const Grain: React.FC<{ readonly opacity?: number }> = ({
  opacity = 0.06,
}) => {
  const tile = 512;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ mixBlendMode: "overlay", opacity }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Img
            key={i}
            src={staticFile("textures/grain.png")}
            style={{
              position: "absolute",
              left: (i % 4) * tile,
              top: Math.floor(i / 4) * tile,
              width: tile,
              height: tile,
            }}
          />
        ))}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.28) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
