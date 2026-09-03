import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Neon/Postgres HTTP client bersifat lazy — membuat client TIDAK membuka koneksi.
// Saat build (tanpa env) kita pakai URL placeholder agar modul bisa dievaluasi;
// query sungguhan baru berjalan di runtime saat DATABASE_URL tersedia.
const url =
  connectionString ??
  "postgresql://placeholder:placeholder@localhost:5432/jobtracker";

export const db = drizzle(neon(url), { schema });
export { schema };
