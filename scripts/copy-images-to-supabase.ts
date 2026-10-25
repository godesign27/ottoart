// Copies every image in the local storage folder into the Supabase "artwork"
// bucket, keeping the same object path (uploads/<id>), file type and
// public/private setting, so the /objects/uploads/<id> URLs stored on
// products keep working unchanged.
//
//   npm run images:to-supabase
//
// Source: ./.local-storage/<local bucket>/<private dir>/uploads/* — filled by
// `npm run import:live` (or by uploads made while running locally).
// Already-copied files are skipped unless --force is passed.
import fs from "fs";
import path from "path";
import { LOCAL_STORAGE_ROOT } from "../server/localObjectStorage";
import { supabaseObjectStorageClient, uploadObject } from "../server/supabaseObjectStorage";

if (process.env.STORAGE_BACKEND !== "supabase") {
  console.error("Refusing to run: STORAGE_BACKEND=supabase is not set (use .env.supabase).");
  process.exit(1);
}

const force = process.argv.includes("--force");
const LOCAL_SOURCE = path.join(LOCAL_STORAGE_ROOT, "local-bucket", "private");
const [, bucket, ...dirParts] = (process.env.PRIVATE_OBJECT_DIR || "/artwork").split("/");
const destPrefix = dirParts.filter(Boolean).join("/");

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listFiles(full);
    return e.name.endsWith(".meta.json") ? [] : [full];
  });
}

async function main() {
  const files = listFiles(LOCAL_SOURCE);
  console.log(`Copying ${files.length} images from ${LOCAL_SOURCE} to bucket "${bucket}"`);
  let copied = 0, skipped = 0;
  const failed: string[] = [];

  await Promise.all(
    Array.from({ length: 6 }, async (_, worker) => {
      for (let i = worker; i < files.length; i += 6) {
        const full = files[i];
        const rel = path.relative(LOCAL_SOURCE, full).split(path.sep).join("/");
        const objectName = destPrefix ? `${destPrefix}/${rel}` : rel;
        try {
          const file = supabaseObjectStorageClient.bucket(bucket).file(objectName);
          if (!force && (await file.exists())[0]) { skipped++; continue; }
          let meta: { contentType?: string; metadata?: Record<string, string> } = {};
          try { meta = JSON.parse(fs.readFileSync(`${full}.meta.json`, "utf8")); } catch {}
          await uploadObject(bucket, objectName, fs.readFileSync(full), meta.contentType || "application/octet-stream");
          if (meta.metadata && Object.keys(meta.metadata).length) await file.setMetadata({ metadata: meta.metadata });
          copied++;
        } catch (err) {
          failed.push(`${rel} (${(err as Error).message})`);
        }
      }
    }),
  );

  console.log(`Images: ${copied} copied, ${skipped} already in Supabase, ${failed.length} failed`);
  if (failed.length) { console.log("  Failed:\n  " + failed.join("\n  ")); process.exitCode = 1; }
}

main();
