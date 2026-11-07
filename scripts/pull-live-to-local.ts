// Copies the LIVE site's data and images onto this Mac so local work never
// touches the real store.
//
//   npm run db:pull-live             # replace local data with live, fetch new images
//   npm run db:pull-live -- --force  # also re-download images already on this Mac
//
// Source: the live Supabase project, from .env.supabase (DATABASE_URL,
//         SUPABASE_URL, SUPABASE_SECRET_KEY). The database is read inside a
//         READ ONLY transaction and images are only downloaded, so nothing live
//         can change.
// Target: the local Postgres in .env.local (must be localhost) and the
//         ./.local-storage image folder. Local tables are emptied and refilled in
//         ONE transaction, so a failed run leaves local data as it was.
// Run `npm run db:push:local` first if the schema changed.
import fs from "fs";
import path from "path";
import { parseEnv } from "util";
import pg from "pg";
import { LOCAL_STORAGE_ROOT } from "../server/localObjectStorage";

const FORCE = process.argv.includes("--force");
const SKIP = new Set(["sessions"]);

const live = parseEnv(fs.readFileSync(".env.supabase", "utf8")) as Record<string, string | undefined>;
const sourceUrl = live.DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
if (!sourceUrl || !live.SUPABASE_URL || !live.SUPABASE_SECRET_KEY) {
  throw new Error(".env.supabase needs DATABASE_URL, SUPABASE_URL and SUPABASE_SECRET_KEY");
}
if (!targetUrl) throw new Error("Set DATABASE_URL in .env.local");
const targetHost = new URL(targetUrl).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(targetHost)) {
  throw new Error(`Target ${targetHost} is not this Mac; refusing to write`);
}

const source = new pg.Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
const target = new pg.Client({ connectionString: targetUrl });
const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

type Col = { name: string; type: string };
async function columns(c: pg.Client): Promise<Map<string, Col[]>> {
  const { rows } = await c.query(`
    select table_name, column_name, data_type from information_schema.columns
    where table_schema = 'public' order by table_name, ordinal_position`);
  const out = new Map<string, Col[]>();
  for (const r of rows) {
    if (!out.has(r.table_name)) out.set(r.table_name, []);
    out.get(r.table_name)!.push({ name: r.column_name, type: r.data_type });
  }
  return out;
}

// Parents before children, from the target's foreign keys.
async function insertOrder(c: pg.Client, tables: string[]): Promise<string[]> {
  const { rows } = await c.query(`
    select tc.table_name as child, ccu.table_name as parent
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`);
  const deps = new Map(tables.map((t) => [t, new Set<string>()]));
  for (const r of rows) if (r.child !== r.parent && deps.has(r.child) && deps.has(r.parent)) deps.get(r.child)!.add(r.parent);
  const done: string[] = [];
  while (done.length < tables.length) {
    const next = tables.filter((t) => !done.includes(t) && [...deps.get(t)!].every((p) => done.includes(p)));
    if (!next.length) throw new Error("Circular foreign keys; cannot order tables");
    done.push(...next.sort());
  }
  return done;
}

async function copyDatabase() {
  await source.connect();
  await target.connect();
  await source.query("begin transaction read only");

  const [srcCols, tgtCols] = await Promise.all([columns(source), columns(target)]);
  const tables = [...srcCols.keys()].filter((t) => !SKIP.has(t));
  const missing: string[] = [];
  for (const t of tables) {
    const tc = tgtCols.get(t);
    if (!tc) { missing.push(`table ${t}`); continue; }
    for (const col of srcCols.get(t)!) if (!tc.some((x) => x.name === col.name)) missing.push(`column ${t}.${col.name}`);
  }
  if (missing.length) {
    throw new Error(`Local schema is behind live (missing ${missing.join(", ")}). Run npm run db:push:local, then retry.`);
  }

  const ordered = await insertOrder(target, tables);
  const data = new Map<string, any[]>();
  for (const t of ordered) data.set(t, (await source.query(`select * from ${q(t)}`)).rows);
  await source.query("rollback");

  await target.query("begin");
  await target.query(`truncate ${ordered.map(q).join(", ")} cascade`);
  for (const t of ordered) {
    const cols = srcCols.get(t)!;
    const json = new Set(tgtCols.get(t)!.filter((c) => c.type === "json" || c.type === "jsonb").map((c) => c.name));
    for (const row of data.get(t)!) {
      const values = cols.map((c) => (json.has(c.name) && row[c.name] != null ? JSON.stringify(row[c.name]) : row[c.name]));
      await target.query(
        `insert into ${q(t)} (${cols.map((c) => q(c.name)).join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
        values,
      );
    }
  }
  await target.query("commit");

  let mismatches = 0;
  console.log("table".padEnd(24) + "live".padStart(8) + "local".padStart(8));
  for (const t of ordered) {
    const now = Number((await target.query(`select count(*) from ${q(t)}`)).rows[0].count);
    const want = data.get(t)!.length;
    if (now !== want) mismatches++;
    console.log(t.padEnd(24) + String(want).padStart(8) + String(now).padStart(8) + (now === want ? "" : "  <- MISMATCH"));
  }
  console.log(mismatches ? `\n${mismatches} table(s) do not match!` : "\nLocal data matches live.");
  if (mismatches) process.exitCode = 1;
}

// ---- images: Supabase bucket -> ./.local-storage, in the layout localObjectStorage.ts reads
const storageBase = `${live.SUPABASE_URL!.replace(/\/$/, "")}/storage/v1`;
const key = live.SUPABASE_SECRET_KEY!;
const headers: Record<string, string> = key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

function splitDir(dir: string | undefined, fallback: string) {
  const [, bucket, ...rest] = (dir || fallback).split("/");
  return { bucket, prefix: rest.filter(Boolean).join("/") };
}
const livePrivate = splitDir(live.PRIVATE_OBJECT_DIR, "/artwork");
const livePublic = splitDir(live.PUBLIC_OBJECT_SEARCH_PATHS?.split(",")[0], "/artwork/public");
const localPrivate = splitDir(process.env.PRIVATE_OBJECT_DIR, "/local-bucket/private");
const localPublic = splitDir(process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(",")[0], "/local-bucket/public");

async function listObjects(bucket: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${storageBase}/object/list/${bucket}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 1000, offset }),
    });
    if (!res.ok) throw new Error(`Listing ${bucket}/${prefix} failed: ${res.status}`);
    const entries: { name: string; id: string | null }[] = await res.json();
    for (const e of entries) {
      const full = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.id === null) out.push(...(await listObjects(bucket, full)));
      else out.push(full);
    }
    if (entries.length < 1000) return out;
  }
}

// Live object name -> local file path, or null if it isn't an app image.
function localPathFor(name: string): string | null {
  const under = (p: string) => (p ? name.startsWith(p + "/") : true);
  const rel = (p: string) => (p ? name.slice(p.length + 1) : name);
  // Public prefix first: it sits inside the private dir when that is the bucket root.
  if (livePublic.bucket === livePrivate.bucket && livePublic.prefix && under(livePublic.prefix)) {
    return path.join(LOCAL_STORAGE_ROOT, localPublic.bucket, localPublic.prefix, rel(livePublic.prefix));
  }
  if (under(livePrivate.prefix)) return path.join(LOCAL_STORAGE_ROOT, localPrivate.bucket, localPrivate.prefix, rel(livePrivate.prefix));
  return null;
}

async function copyImages() {
  const bucket = livePrivate.bucket;
  const all = await listObjects(bucket);
  const files = all.filter((n) => !n.startsWith("_meta/") && !n.endsWith("/.emptyFolderPlaceholder") && n !== ".emptyFolderPlaceholder");
  let copied = 0, skipped = 0;
  const failed: string[] = [];
  await Promise.all(
    Array.from({ length: 6 }, async (_, worker) => {
      for (let i = worker; i < files.length; i += 6) {
        const name = files[i];
        const dest = localPathFor(name);
        if (!dest) { skipped++; continue; }
        if (!FORCE && fs.existsSync(dest)) { skipped++; continue; }
        try {
          const res = await fetch(`${storageBase}/object/authenticated/${bucket}/${encodePath(name)}`, { headers });
          if (!res.ok) throw new Error(String(res.status));
          const contentType = res.headers.get("content-type") || "application/octet-stream";
          const body = Buffer.from(await res.arrayBuffer());
          const aclRes = await fetch(`${storageBase}/object/authenticated/${bucket}/${encodePath(`_meta/${name}.json`)}`, { headers });
          const metadata = aclRes.ok ? await aclRes.json() : {};
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, body);
          fs.writeFileSync(`${dest}.meta.json`, JSON.stringify({ contentType, metadata }));
          copied++;
        } catch (err) {
          failed.push(`${name} (${(err as Error).message})`);
        }
      }
    }),
  );
  console.log(`Images: ${files.length} live, ${copied} downloaded, ${skipped} already here`);
  if (failed.length) { console.log("  Failed:\n  " + failed.join("\n  ")); process.exitCode = 1; }
}

async function main() {
  await copyDatabase();
  await copyImages();
}

main()
  .catch(async (err) => {
    console.error("\nStopped:", err.message);
    try { await target.query("rollback"); } catch {}
    process.exitCode = 1;
  })
  .finally(async () => { await source.end().catch(() => {}); await target.end().catch(() => {}); });
