import { CameraMotionBlur } from "@remotion/motion-blur";
import { useCurrentFrame } from "remotion";

/**
 * Film-style motion blur (180° shutter), switched on only inside the given frame
 * windows: the fast moves get blur and everything else renders at full speed.
 * Wrap the scene component itself, so its hooks see the sub-frame samples.
 */
export const MotionBlur: React.FC<{
  readonly windows: [number, number][];
  readonly samples?: number;
  readonly children: React.ReactNode;
}> = ({ windows, samples = 8, children }) => {
  const frame = useCurrentFrame();
  const on = windows.some(([a, b]) => frame >= a && frame < b);
  if (!on) return <>{children}</>;
  return (
    <CameraMotionBlur shutterAngle={180} samples={samples}>
      {children}
    </CameraMotionBlur>
  );
};
