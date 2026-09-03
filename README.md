# JobTracker 🎯

Aplikasi web pelacak lamaran kerja personal — catat, pantau, dan evaluasi seluruh proses rekrutmen dalam satu dashboard. Dibangun dari PRD lengkap (Indonesia) sebagai proyek portfolio full-stack.

## Fitur MVP

- 🔐 **Auth Google OAuth** — sesi persisten, proteksi seluruh route via middleware
- 📋 **CRUD Lamaran** — 20+ field (posisi, gaji, sumber, prioritas, tanggal, dst) dengan validasi Zod client + server
- 📊 **Dashboard** — statistik real-time, agenda terdekat, task aktif, aktivitas terbaru
- 🗂️ **Tabel + Filter** — pencarian, filter status, sorting, pagination, arsip (state di URL)
- 🎯 **Kanban drag-and-drop** — 13 kolom status, optimistic update dengan rollback otomatis, alasan wajib untuk Reject/Withdraw
- 📅 **Kalender** — tampilan bulan & agenda: interview, task, deadline
- ⏰ **Reminder cron** — idempoten via `deduplication_key` (interview besok, task overdue, follow-up > 14 hari)
- 🔔 **Notification center** — badge unread, mark all as read
- 📎 **Dokumen privat** — Vercel Blob private storage, validasi tipe/ukuran, soft delete
- 🏢 **Perusahaan & Kontak** — deteksi nama mirip, relasi lamaran, rating ketertarikan
- 📈 **Analytics** — response/interview/offer rate, funnel rekrutmen, sumber efektif, alasan penolakan
- 📤 **Export CSV** — semua lamaran atau per filter
- 🌙 **Dark mode** + responsive mobile-first + keyboard accessible

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Bahasa | TypeScript strict |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) |
| Backend | Server Actions + Route Handlers |
| Database | Neon PostgreSQL (Drizzle ORM) |
| Auth | Auth.js v5 + Google + Drizzle Adapter |
| Drag & drop | dnd-kit |
| Charts | Recharts |
| Storage | Vercel Blob (private) |

## Menjalankan Lokal

```bash
pnpm install
cp .env.example .env.local   # isi DATABASE_URL (Neon), AUTH_SECRET, AUTH_GOOGLE_ID/SECRET
npx drizzle-kit push         # push schema ke database
pnpm dev
```

Buka http://localhost:3000 → otomatis redirect ke `/login`.

## Deploy ke Vercel

1. Import repo ke Vercel
2. Buat database Neon via Vercel Marketplace → set `DATABASE_URL`
3. Set env: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`
4. Callback OAuth Google: `https://<domain>/api/auth/callback/google`
5. Cron reminder sudah terdaftar di `vercel.json` (harian 01:00 UTC)

## Struktur

```
src/
├── app/
│   ├── actions/          # Server Actions (CRUD + validasi)
│   ├── api/              # auth, blob, cron, export, health
│   ├── dashboard|applications|kanban|calendar|companies|contacts|documents|analytics|settings
│   └── login/
├── components/           # Form dialogs, badges, layout, dsb
├── lib/
│   ├── db/schema.ts      # 14 tabel Drizzle
│   ├── queries.ts        # Query relasi + agregasi
│   ├── validations.ts    # Zod schemas
│   └── status.ts         # 13 status + grouping + warna
└── middleware.ts         # Route protection
```

## Status Workflow

```
Wishlist → Preparing → Applied → Screening → Assessment →
HR Interview → User Interview → Final Interview → Offering → Accepted
                                                      ↘ Rejected / Withdrawn / No Response
```
