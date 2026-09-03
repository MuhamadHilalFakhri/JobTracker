import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { cwd } from "node:process";

const USER_ID = "demo-user";
const now = new Date();
const days = (n) => new Date(now.getTime() + n * 86400000);

async function main() {
  const db = new PGlite(path.resolve(cwd(), ".pglite"));
  const run = async (sql, params = []) => db.query(sql, params);

  // ---- Pastikan user demo ----
  await run("INSERT INTO users (id, name, email) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING", [
    USER_ID, "Hilal (Demo)", "demo@jobtracker.local",
  ]);

  // ---- Companies ----
  const companies = [
    { name: "Tokopedia", industry: "E-commerce", location: "Jakarta", size: ">1000", rating: 5 },
    { name: "Gojek", industry: "Transportasi", location: "Jakarta", size: ">1000", rating: 4 },
    { name: "Alterra Academy", industry: "Edukasi", location: "Remote", size: "10-50", rating: 3 },
    { name: "Shopee", industry: "E-commerce", location: "Jakarta", size: ">1000", rating: 4 },
    { name: "Dicoding", industry: "Edukasi", location: "Bandung", size: "51-200", rating: 3 },
  ];
  const companyIds = {};
  for (const c of companies) {
    const res = await run(
      "INSERT INTO companies (id, user_id, name, slug, industry, company_size, location, interest_rating) VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [USER_ID, c.name, c.name.toLowerCase().replace(/\s+/g, "-"), c.industry, c.size, c.location, c.rating]
    );
    companyIds[c.name] = res.rows[0].id;
  }

  // ---- Sources ----
  const sources = ["LinkedIn", "JobStreet", "Glints", "Website Perusahaan", "Referensi"];
  const sourceIds = {};
  for (const s of sources) {
    const res = await run(
      "INSERT INTO application_sources (id, user_id, name) VALUES (gen_random_uuid(), $1, $2) RETURNING id",
      [USER_ID, s]
    );
    sourceIds[s] = res.rows[0].id;
  }

  // ---- Applications (15 sample dengan status beragam) ----
  const apps = [
    // [posisi, company, status, source, appliedDaysAgo, deadlineDaysAhead, gaji, priority]
    ["Full-Stack Developer", "Tokopedia", "Final Interview", "LinkedIn", -40, null, 25_000_000, "High"],
    ["Backend Engineer (Go)", "Gojek", "HR Interview", "LinkedIn", -21, null, 22_000_000, "High"],
    ["Frontend Developer", "Tokopedia", "Assessment", "Glints", -14, null, 20_000_000, "Medium"],
    ["Software Engineer Intern", "Dicoding", "Screening", "Website Perusahaan", -10, 12, 3_000_000, "Medium"],
    ["Full-Stack Developer", "Alterra Academy", "Applied", "Referensi", -6, 20, 15_000_000, "Medium"],
    ["Data Engineer", "Shopee", "User Interview", "LinkedIn", -30, null, 24_000_000, "High"],
    ["Backend Developer (Node)", "Dicoding", "Rejected", "JobStreet", -18, null, 18_000_000, "Low"],
    ["Mobile Developer", "Gojek", "Offering", "Referensi", -35, -3, 21_000_000, "High"],
    ["QA Engineer", "Shopee", "No Response", "JobStreet", -28, null, 16_000_000, "Low"],
    ["DevOps Engineer", "Tokopedia", "Wishlist", "LinkedIn", 0, 30, 25_000_000, "Medium"],
    ["System Analyst", "Alterra Academy", "Preparing", "Glints", 0, 15, 12_000_000, "Low"],
    ["Backend Engineer", "Dicoding", "Accepted", "Website Perusahaan", -50, null, 12_000_000, "High"],
    ["SRE Engineer", "Gojek", "Screening", "LinkedIn", -8, null, 26_000_000, "Medium"],
    ["Technical Writer", "Alterra Academy", "Withdrawn", "JobStreet", -12, null, 10_000_000, "Low"],
    ["Product Engineer", "Shopee", "HR Interview", "Glints", -9, null, 19_000_000, "Medium"],
  ];

  for (const [pos, comp, status, src, appliedAgo, deadlineAhead, salary, priority] of apps) {
    const appliedAt = appliedAgo < 0 ? days(appliedAgo) : null;
    const deadline = deadlineAhead != null ? days(deadlineAhead) : null;
    const res = await run(
      `INSERT INTO job_applications (id, user_id, company_id, position_title, work_mode, employment_type, seniority_level, source_id, salary_min, salary_max, salary_currency, salary_period, status, priority, found_at, applied_at, deadline_at, last_activity_at, notes)
       VALUES (gen_random_uuid(), $1,$2,$3, 'Remote', 'Full-time', 'Mid', $4, $5, $6, 'IDR', 'bulanan', $7, $8, $9, $9, $10, $9, $11) RETURNING id`,
      [USER_ID, companyIds[comp], pos, sourceIds[src], salary - 3_000_000, salary, status, priority, appliedAt, deadline, "Sample untuk demo"]
    );
    const appId = res.rows[0].id;

    // Status history
    const statuses = ["Wishlist", "Preparing", "Applied", "Screening", "Assessment", "HR Interview", "User Interview", "Final Interview", "Offering", "Accepted"];
    const idx = statuses.indexOf(status);
    for (let i = 0; i <= idx; i++) {
      const d = new Date(appliedAt ? appliedAt.getTime() - (idx - i) * 3 * 86400000 : now.getTime() - (idx - i + 1) * 86400000);
      await run(
        "INSERT INTO application_status_histories (id, application_id, from_status, to_status, changed_at) VALUES (gen_random_uuid(), $1, $2, $3, $4)",
        [appId, i === 0 ? null : statuses[i - 1], statuses[i], d]
      );
    }
  }

  // ---- Interviews (beberapa mendatang) ----
  const upcoming = [
    ["Interview Teknis dengan Engineering Manager", "Tokopedia", 1, 2],   // besok
    ["HR Interview lanjutan", "Gojek", 3, 4],                               // lusa
    ["Technical Test: Live Coding", "Shopee", 5, 6],                        // 5 hari lagi
  ];
  for (const [title, comp, dayAhead, hour] of upcoming) {
    const start = days(dayAhead); start.setHours(10 + hour, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    await run(
      "INSERT INTO interviews (id, user_id, title, type, start_at, end_at, mode, status) VALUES (gen_random_uuid(), $1,$2,'Interview',$3,$4,'Online','Scheduled')",
      [USER_ID, title, start, end]
    );
  }

  // ---- Tasks ----
  const taskDefs = [
    ["Persiapan interview: riset produk Tokopedia", "prepare", 1, "High"],
    ["Kirim follow-up email ke recruiter Gojek", "follow-up", 2, "Medium"],
    ["Kerjakan technical test Shopee", "test", 4, "High"],
    ["Update CV versi 2026", "general", 6, "Low"],
  ];
  for (const [title, type, dueAhead, prio] of taskDefs) {
    await run(
      "INSERT INTO tasks (id, user_id, title, type, priority, status, due_at) VALUES (gen_random_uuid(), $1,$2,$3,$4,'To Do',$5)",
      [USER_ID, title, type, prio, days(dueAhead)]
    );
  }

  // ---- Notes ----
  await run("INSERT INTO notes (id, user_id, title, content) VALUES (gen_random_uuid(), $1,'Catatan','Siapkan contoh portofolio StreamFilm untuk demo interview.')", [USER_ID]);

  console.log("✓ Seed demo berhasil — 5 perusahaan, 5 sumber, 15 lamaran, 3 interview, 4 task");
  await db.close();
}

main().catch((e) => { console.error("Gagal seed:", e.message); process.exit(1); });
