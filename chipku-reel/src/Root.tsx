import { Composition, Folder } from "remotion";
import { ChipkuReelComposition } from "./ChipkuReelComposition";
import { AvatarTest } from "./dev/AvatarTest";
import { ProductTest } from "./dev/ProductTest";

export const RemotionRoot: React.FC = () => (
  <>
    <ChipkuReelComposition />
    <Folder name="Dev">
      <Composition id="AvatarTest" component={AvatarTest} width={1920} height={1080} fps={30} durationInFrames={30} />
      <Composition id="ProductTest" component={ProductTest} width={1920} height={1080} fps={30} durationInFrames={30} />
    </Folder>
  </>
);
