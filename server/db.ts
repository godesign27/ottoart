import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import pg from "pg";
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// LOCAL_DEV=1 talks to a plain local Postgres over TCP; otherwise use Neon's
// websocket driver as on Replit.
const isLocalDev = process.env.LOCAL_DEV === "1";

let pool: any;
let db: any;

if (isLocalDev) {
  // DATABASE_SSL=no-verify: encrypted connection without CA verification
  // (Supabase test setup). Production should verify with Supabase's CA cert.
  const ssl = process.env.DATABASE_SSL === "no-verify" ? { rejectUnauthorized: false } : undefined;
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl });
  db = drizzlePg(pool, { schema });
} else {
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
}

export { pool, db };
