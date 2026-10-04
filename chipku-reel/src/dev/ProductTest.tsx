import { AbsoluteFill } from "remotion";
import { Polaroid, Poster, Sticker } from "../components/ProductArt";
import { C } from "../theme";

export const ProductTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.yellow, flexWrap: "wrap", flexDirection: "row", gap: 50, padding: 60, alignItems: "center" }}>
    <Poster kind="sports" width={220} />
    <Poster kind="cars" width={220} />
    <Poster kind="music" width={220} />
    <Poster kind="motivation" width={220} />
    <Poster kind="trending" width={220} />
    <Polaroid kind="cars" width={240} caption="cars" />
    <Polaroid kind="music" width={240} />
    <Sticker kind="sports" size={200} />
    <Sticker kind="music" size={200} />
    <Sticker kind="trending" size={200} />
    <Sticker kind="logo" size={180} />
  </AbsoluteFill>
);
