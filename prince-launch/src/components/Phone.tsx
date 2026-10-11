import { C, F } from "../theme";

export const PHONE_W = 340;
export const PHONE_H = 700;

/** Minimal flagship-style phone: thin bezel, island, status bar. */
export const Phone: React.FC<{
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: 56,
      padding: 10,
      background:
        "linear-gradient(145deg, #2a2a2a 0%, #0c0c0c 45%, #1c1c1c 100%)",
      boxShadow:
        "inset 0 0 0 1.5px rgba(255,255,255,0.18), 0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.9)",
      ...style,
    }}
  >
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 46,
        overflow: "hidden",
        background: "#0B0B0B",
      }}
    >
      {children}
      {/* status bar + island */}
      <div
        style={{
          position: "absolute",
          left: 28,
          top: 16,
          fontFamily: F.ui,
          fontWeight: 600,
          fontSize: 15,
          color: C.white,
        }}
      >
        9:41
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 12,
          width: 104,
          height: 30,
          marginLeft: -52,
          borderRadius: 20,
          background: "#000",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 26,
          top: 20,
          width: 26,
          height: 12,
          borderRadius: 4,
          border: `1.5px solid ${C.dim}`,
        }}
      >
        <div
          style={{
            margin: 1.5,
            width: 16,
            height: 6,
            borderRadius: 2,
            background: C.white,
          }}
        />
      </div>
    </div>
  </div>
);
