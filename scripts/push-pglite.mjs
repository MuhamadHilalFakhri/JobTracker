import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import fs from "node:fs";
import { cwd } from "node:process";

const sqlDir = path.resolve(cwd(), "drizzle");
const files = fs.readdirSync(sqlDir).filter((f) => f.endsWith(".sql")).sort();

async function main() {
  console.log("Memulai PGlite...");
  const db = new PGlite(path.resolve(cwd(), ".pglite"));

  for (const file of files) {
    const sql = fs.readFileSync(path.join(sqlDir, file), "utf-8");
    console.log(`  Menjalankan ${file}...`);
    await db.exec(sql);
  }

  console.log("✓ Schema berhasil di-push");
  await db.close();
}

main().catch((e) => {
  console.error("Gagal:", e.message);
  process.exit(1);
});