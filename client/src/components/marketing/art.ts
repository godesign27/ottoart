// Image URLs at the right size. Uploaded artwork (/objects/...) can be resized by the server (?w=), so a
// thumbnail never downloads a 2 MB original. Other images (bundled assets) are returned unchanged.
const WIDTHS = [160, 320, 480, 640, 960, 1280, 1600] as const;

export function isResizable(src: string) {
  return src.startsWith("/objects/");
}

export function artSrc(src: string, width: number): string {
  if (!isResizable(src)) return src;
  const w = WIDTHS.find((x) => x >= width) ?? 1600;
  return `${src}${src.includes("?") ? "&" : "?"}w=${w}`;
}

export function artSrcSet(src: string, widths: readonly number[] = [320, 640, 960, 1280]): string | undefined {
  if (!isResizable(src)) return undefined;
  return widths.map((w) => `${artSrc(src, w)} ${w}w`).join(", ");
}
