import { Composition, Folder } from "remotion";
import { ChipkuReel } from "./ChipkuReel";
import { AvatarTest } from "./dev/AvatarTest";
import { ProductTest } from "./dev/ProductTest";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ChipkuReel"
      component={ChipkuReel}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={600}
    />
    <Folder name="Dev">
      <Composition id="AvatarTest" component={AvatarTest} width={1920} height={1080} fps={30} durationInFrames={30} />
      <Composition id="ProductTest" component={ProductTest} width={1920} height={1080} fps={30} durationInFrames={30} />
    </Folder>
  </>
);
