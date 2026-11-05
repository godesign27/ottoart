// Copies the PUBLIC catalogue of the live site into the local dev database,
// plus every /objects/uploads/* image it references into ./.local-storage.
//
//   npm run import:live                 # from https://ottoart.app
//   npm run import:live -- https://other-host
//
// Only reads public, unauthenticated API endpoints. Admin-only data (orders,
// customers, messages, commissions, mailing list, boards, art shows) is not
// reachable that way and is left untouched. Local rows in the imported tables
// are REPLACED by the live copy. Refuses to run unless LOCAL_DEV=1.
import fs from "fs";
import path from "path";
import { getTableColumns, sql } from "drizzle-orm";
import { db, pool } from "../server/db";
import {
  products, categories, tags, galleryItems, events, pageSettings, siteSettings,
  subscriptionPlans, roomBackgrounds, bioSettings, contactSettings, socialSettings,
} from "@shared/schema";
import { LOCAL_STORAGE_ROOT } from "../server/localObjectStorage";

if (process.env.LOCAL_DEV !== "1") {
  console.error("Refusing to run: LOCAL_DEV=1 is not set (this replaces local data).");
  process.exit(1);
}

const BASE = (process.argv[2] || "https://ottoart.app").replace(/\/$/, "");

async function getJson(p: string): Promise<any> {
  const res = await fetch(`${BASE}/api/${p}`);
  if (!res.ok) throw new Error(`GET /api/${p} -> ${res.status}`);
  return res.json();
}

const asList = (d: any) => (d == null ? [] : Array.isArray(d) ? d : [d]);

// Turn API JSON into insertable rows: keep only real columns and turn ISO
// strings back into Dates for timestamp columns.
function toRows(table: any, data: any[]) {
  const cols = getTableColumns(table) as Record<string, any>;
  return data.map((rec) => {
    const row: Record<string, any> = {};
    for (const [key, col] of Object.entries(cols)) {
      if (!(key in rec)) continue;
      const v = rec[key];
      row[key] = v != null && col.columnType === "PgTimestamp" ? new Date(v) : v;
    }
    return row;
  });
}

async function main() {
  console.log(`Importing public data from ${BASE}`);

  // Fetch everything first so a network failure leaves local data untouched.
  const [cats, tagList, prods, gallery, evPublished, evFeatured, pages, site, plans, rooms, bio, contact, social] =
    await Promise.all([
      getJson("categories"), getJson("tags"), getJson("products"), getJson("gallery"),
      getJson("events/published"), getJson("events/featured"), getJson("page-settings"),
      getJson("site-settings"), getJson("subscription-plans"), getJson("room-backgrounds"),
      getJson("bio-settings"), getJson("contact-settings"), getJson("social-settings"),
    ]);

  const eventsById = new Map<string, any>();
  for (const e of [...asList(evPublished), ...asList(evFeatured)]) if (e?.id) eventsById.set(e.id, e);

  // Children before parents for deletes, parents before children for inserts.
  const plan: Array<[string, any, any[]]> = [
    ["categories", categories, asList(cats)],
    ["tags", tags, asList(tagList)],
    ["products", products, asList(prods)],
    ["gallery_items", galleryItems, asList(gallery)],
    ["events", events, [...eventsById.values()]],
    ["page_settings", pageSettings, asList(pages)],
    ["site_settings", siteSettings, asList(site)],
    ["subscription_plans", subscriptionPlans, asList(plans)],
    ["room_backgrounds", roomBackgrounds, asList(rooms)],
    ["bio_settings", bioSettings, asList(bio)],
    ["contact_settings", contactSettings, asList(contact)],
    ["social_settings", socialSettings, asList(social)],
  ];

  await db.transaction(async (tx: any) => {
    // Local-only rows that point at products would block the delete.
    await tx.execute(sql`delete from cart_items`);
    await tx.execute(sql`delete from favorites`);
    await tx.execute(sql`delete from board_items`);
    for (const [, table] of [...plan].reverse()) await tx.delete(table);
    for (const [name, table, data] of plan) {
      const rows = toRows(table, data);
      if (rows.length) await tx.insert(table).values(rows);
      console.log(`  ${name}: ${rows.length}`);
    }
  });

  // Images: every /objects/uploads/<id> mentioned anywhere in the data.
  const allJson = JSON.stringify(plan.map(([, , d]) => d));
  const objectPaths = [...new Set(allJson.match(/\/objects\/uploads\/[A-Za-z0-9._-]+/g) || [])];
  const privateDir = (process.env.PRIVATE_OBJECT_DIR || "/local-bucket/private").replace(/^\/|\/$/g, "");
  let ok = 0, skipped = 0;
  const failed: string[] = [];

  await Promise.all(
    Array.from({ length: 6 }, async (_, worker) => {
      for (let i = worker; i < objectPaths.length; i += 6) {
        const objPath = objectPaths[i];
        const dest = path.join(LOCAL_STORAGE_ROOT, privateDir, objPath.replace(/^\/objects\//, ""));
        if (fs.existsSync(dest)) { skipped++; continue; }
        try {
          const res = await fetch(`${BASE}${objPath}`);
          if (!res.ok) throw new Error(String(res.status));
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
          // Same metadata the local storage layer writes on upload, marked public.
          fs.writeFileSync(`${dest}.meta.json`, JSON.stringify({
            contentType: res.headers.get("content-type") || "application/octet-stream",
            metadata: { "custom:aclPolicy": JSON.stringify({ owner: "system", visibility: "public" }) },
          }));
          ok++;
        } catch (err) {
          failed.push(`${objPath} (${(err as Error).message})`);
        }
      }
    }),
  );

  console.log(`Images: ${ok} downloaded, ${skipped} already present, ${failed.length} failed`);
  if (failed.length) console.log("  Failed:\n  " + failed.join("\n  "));
}

main()
  .catch((err) => { console.error("Import failed:", err); process.exitCode = 1; })
  .finally(() => pool.end());
