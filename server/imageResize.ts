import type { Response } from "express";
import sharp from "sharp";

// Resized copies of public images, so a page of thumbnails doesn't download 2 MB originals.
// Request with /objects/uploads/<id>?w=480. Only these widths are allowed, so the cache can't be flooded.
export const RESIZE_WIDTHS = [160, 320, 480, 640, 960, 1280, 1600] as const;
const MAX_CACHE_BYTES = 150 * 1024 * 1024;

const cache = new Map<string, Buffer>(); // insertion order doubles as LRU order
let cacheBytes = 0;
const inflight = new Map<string, Promise<Buffer>>();

export function parseResizeWidth(raw: unknown): number | null {
  const w = Number(raw);
  return (RESIZE_WIDTHS as readonly number[]).includes(w) ? w : null;
}

function remember(key: string, buf: Buffer) {
  cache.set(key, buf);
  cacheBytes += buf.length;
  while (cacheBytes > MAX_CACHE_BYTES && cache.size > 1) {
    const oldest = cache.keys().next().value as string;
    cacheBytes -= cache.get(oldest)!.length;
    cache.delete(oldest);
  }
}

async function readAll(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  return Buffer.concat(chunks);
}

/** Send a WebP no wider than `width`. Never enlarges. Caller has already checked the object is public. */
export async function sendResized(
  key: string,
  width: number,
  openStream: () => NodeJS.ReadableStream,
  res: Response,
) {
  const cacheKey = `${key}@${width}`;
  let buf = cache.get(cacheKey);
  if (buf) {
    cache.delete(cacheKey); // refresh LRU position
    cache.set(cacheKey, buf);
  } else {
    let job = inflight.get(cacheKey);
    if (!job) {
      job = readAll(openStream())
        .then((input) => sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer())
        .finally(() => inflight.delete(cacheKey));
      inflight.set(cacheKey, job);
    }
    buf = await job;
    remember(cacheKey, buf);
  }
  res.set({
    "Content-Type": "image/webp",
    "Content-Length": String(buf.length),
    "Cache-Control": "public, max-age=86400",
    Vary: "Accept",
  });
  res.end(buf);
}
