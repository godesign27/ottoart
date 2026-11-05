import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import pg from "pg";
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Driver choice:
//  - node-postgres (TCP) for Supabase, a local Postgres (LOCAL_DEV=1), or DB_DRIVER=pg
//  - Neon's websocket driver otherwise — unchanged behaviour for Replit's database
const databaseHost = (() => {
  try { return new URL(process.env.DATABASE_URL!).hostname; } catch { return ""; }
})();
const usePg =
  process.env.DB_DRIVER === "pg" ||
  process.env.LOCAL_DEV === "1" ||
  /(^|\.)supabase\.(com|co)$/.test(databaseHost);

// Both drivers expose the same Drizzle query API; one type keeps callers typed.
type Database = NodePgDatabase<typeof schema>;

let pool: pg.Pool | NeonPool;
let db: Database;

if (usePg) {
  // DATABASE_SSL=no-verify: encrypted connection without CA verification
  // (Supabase test setup). Production should verify with Supabase's CA cert.
  const ssl = process.env.DATABASE_SSL === "no-verify" ? { rejectUnauthorized: false } : undefined;
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl });
  db = drizzlePg(pool, { schema });
} else {
  neonConfig.webSocketConstructor = ws;
  const neonPool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  pool = neonPool;
  db = drizzleNeon({ client: neonPool, schema }) as unknown as Database;
}

export { pool, db };
