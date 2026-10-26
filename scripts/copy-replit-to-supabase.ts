// Copies EVERY table (except login sessions) from the Replit production
// database into the Supabase database, then compares row counts.
//
//   npm run copy:replit-to-supabase              # dry run: counts + checks only
//   npm run copy:replit-to-supabase -- --apply   # replace Supabase data with Replit's
//
// Source: REPLIT_PROD_DATABASE_URL in .env.replit-prod — opened in a
//         READ ONLY transaction, so nothing on Replit can change.
// Target: DATABASE_URL in .env.supabase. With --apply, all copied tables are
//         emptied and refilled inside ONE transaction: it fully succeeds or
//         leaves Supabase exactly as it was.
// The run stops before writing anything if the two databases' tables or
// columns don't match.
import pg from "pg";

const APPLY = process.argv.includes("--apply");
const SKIP = new Set(["sessions"]); // logins don't carry over; everyone signs in again

const sourceUrl = process.env.REPLIT_PROD_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
if (!sourceUrl || sourceUrl.includes("PASTE_")) throw new Error("Set REPLIT_PROD_DATABASE_URL in .env.replit-prod");
if (!targetUrl || targetUrl.includes("YOUR-PASSWORD")) throw new Error("Set DATABASE_URL in .env.supabase");
if (!/supabase\.(com|co)/.test(targetUrl)) throw new Error("Target is not a Supabase database; refusing to write");

const ssl = { rejectUnauthorized: false };
const source = new pg.Client({ connectionString: sourceUrl, ssl: sourceUrl.includes("sslmode=disable") ? false : ssl });
const target = new pg.Client({ connectionString: targetUrl, ssl });

type Col = { name: string; type: string };

async function columns(c: pg.Client): Promise<Map<string, Col[]>> {
  const { rows } = await c.query(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position`);
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

const q = (id: string) => `"${id.replace(/"/g, '""')}"`;

async function main() {
  await source.connect();
  await target.connect();
  await source.query("begin transaction read only");

  const [srcCols, tgtCols] = await Promise.all([columns(source), columns(target)]);
  const tables = [...srcCols.keys()].filter((t) => !SKIP.has(t));

  // Structure check: every source table/column must exist in the target.
  const problems: string[] = [];
  for (const t of tables) {
    const tc = tgtCols.get(t);
    if (!tc) { problems.push(`table ${t} is missing in Supabase`); continue; }
    for (const col of srcCols.get(t)!) if (!tc.some((x) => x.name === col.name)) problems.push(`column ${t}.${col.name} is missing in Supabase`);
  }
  for (const t of tgtCols.keys()) if (!srcCols.has(t) && !SKIP.has(t)) problems.push(`table ${t} exists only in Supabase (left untouched)`);
  const blocking = problems.filter((p) => !p.includes("left untouched"));
  if (problems.length) console.log("Structure notes:\n  " + problems.join("\n  "));
  if (blocking.length) throw new Error("Structures differ; nothing was written. Fix the schema first.");

  const ordered = await insertOrder(target, tables);
  const data = new Map<string, any[]>();
  for (const t of ordered) data.set(t, (await source.query(`select * from ${q(t)}`)).rows);
  await source.query("rollback");

  const before = new Map<string, number>();
  for (const t of ordered) before.set(t, Number((await target.query(`select count(*) from ${q(t)}`)).rows[0].count));

  if (APPLY) {
    await target.query("begin");
    await target.query(`truncate ${ordered.map(q).join(", ")} cascade`);
    for (const t of ordered) {
      const rows = data.get(t)!;
      const cols = srcCols.get(t)!;
      const json = new Set(tgtCols.get(t)!.filter((c) => c.type === "json" || c.type === "jsonb").map((c) => c.name));
      for (const row of rows) {
        const values = cols.map((c) => (json.has(c.name) && row[c.name] != null ? JSON.stringify(row[c.name]) : row[c.name]));
        await target.query(
          `insert into ${q(t)} (${cols.map((c) => q(c.name)).join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
          values,
        );
      }
    }
    await target.query("commit");
  }

  console.log(`\n${APPLY ? "COPIED" : "DRY RUN (add --apply to copy)"}\n`);
  console.log("table".padEnd(24) + "replit".padStart(8) + "supabase before".padStart(17) + (APPLY ? "supabase now".padStart(14) : ""));
  let mismatches = 0;
  for (const t of ordered) {
    const src = data.get(t)!.length;
    let line = t.padEnd(24) + String(src).padStart(8) + String(before.get(t)).padStart(17);
    if (APPLY) {
      const now = Number((await target.query(`select count(*) from ${q(t)}`)).rows[0].count);
      if (now !== src) mismatches++;
      line += String(now).padStart(14) + (now === src ? "" : "  <- MISMATCH");
    }
    console.log(line);
  }
  if (APPLY) console.log(mismatches ? `\n${mismatches} table(s) do not match!` : "\nAll copied tables match Replit exactly.");
}

main()
  .catch(async (err) => {
    console.error("\nStopped:", err.message);
    try { await target.query("rollback"); } catch {}
    process.exitCode = 1;
  })
  .finally(async () => { await source.end().catch(() => {}); await target.end().catch(() => {}); });
