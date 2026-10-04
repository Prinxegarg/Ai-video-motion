// Asset imports are bundled by Remotion (png/wav → URL string).
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.wav" {
  const src: string;
  export default src;
}
