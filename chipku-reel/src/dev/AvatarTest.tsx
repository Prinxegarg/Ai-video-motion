import { AbsoluteFill } from "remotion";
import { Avatar } from "../components/Avatar";
import { C } from "../theme";

export const AvatarTest: React.FC = () => (
  <AbsoluteFill style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" }}>
    <AbsoluteFill style={{ background: `linear-gradient(90deg, ${C.paper} 0 25%, ${C.yellow} 25% 50%, ${C.ink} 50% 75%, ${C.orange} 75%)` }} />
    <Avatar style={{ scale: "0.75", transformOrigin: "bottom center" }} />
    <Avatar grin={1} brows={1} lookX={-1} tilt={-6} style={{ scale: "0.75", transformOrigin: "bottom center" }} />
    <Avatar wink={1} grin={0.6} arm={-10} style={{ scale: "0.75", transformOrigin: "bottom center" }} />
    <Avatar blink={0.9} body={false} lookY={-1} style={{ scale: "0.75", transformOrigin: "bottom center" }} />
  </AbsoluteFill>
);
