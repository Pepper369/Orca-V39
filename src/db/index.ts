import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __pool?: Pool;
  __db?: ReturnType<typeof drizzle>;
};

function url() {
  const v = process.env.DATABASE_URL;
  if (!v) throw new Error("DATABASE_URL is required — copy .env.example to .env");
  return v;
}

export function getPool() {
  if (globalForDb.__pool) return globalForDb.__pool;
  const pool = new Pool({ connectionString: url(), max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
  globalForDb.__pool = pool;
  return pool;
}

export function getDb() {
  if (globalForDb.__db) return globalForDb.__db;
  const db = drizzle(getPool());
  globalForDb.__db = db;
  return db;
}
