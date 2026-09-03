import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import path from "node:path";

const connectionString = process.env.DATABASE_URL;

// Produksi: Neon HTTP (serverless). Dev lokal tanpa DATABASE_URL: PGlite embedded
// (data tersimpan di ./.pglite — jalankan `node scripts/push-pglite.mjs` untuk schema).
const g = globalThis as unknown as { __pglite?: PGlite };

function createDb() {
  if (connectionString) {
    return drizzleNeon(neon(connectionString), { schema });
  }
  if (!g.__pglite) {
    g.__pglite = new PGlite(path.resolve(process.cwd(), ".pglite"));
  }
  return drizzlePglite(g.__pglite, { schema });
}

export const db = createDb();
export { schema };
