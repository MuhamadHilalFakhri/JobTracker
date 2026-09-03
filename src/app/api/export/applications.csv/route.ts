import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { jobApplications, companies, applicationSources, contacts } from "@/lib/db/schema"
import { and, eq, isNull, inArray, sql } from "drizzle-orm"
import { STATUSES } from "@/lib/status"

function escapeCsv(value: unknown): string {
  if (value == null) return ""
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  // Filter opsional dari query
  const status = req.nextUrl.searchParams.get("status")
  const companyId = req.nextUrl.searchParams.get("company")
  const group = req.nextUrl.searchParams.get("group")

  const conditions = [
    eq(jobApplications.userId, userId),
    isNull(jobApplications.deletedAt),
  ]
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    conditions.push(eq(jobApplications.status, status))
  }
  if (group === "active") {
    conditions.push(sql`${jobApplications.status} in ('Applied','Screening','Assessment','HR Interview','User Interview','Final Interview','Offering')`)
  }
  if (group === "finished") {
    conditions.push(sql`${jobApplications.status} in ('Accepted','Rejected','Withdrawn','No Response')`)
  }
  if (companyId) conditions.push(eq(jobApplications.companyId, companyId))

  const apps = await db.select().from(jobApplications).where(and(...conditions))

  // Load relasi
  const companyIds = [...new Set(apps.map((a) => a.companyId).filter(Boolean))] as string[]
  const sourceIds = [...new Set(apps.map((a) => a.sourceId).filter(Boolean))] as string[]
  const companyMap = companyIds.length > 0
    ? new Map((await db.select().from(companies).where(inArray(companies.id, companyIds))).map((c) => [c.id, c.name]))
    : new Map()
  const sourceMap = sourceIds.length > 0
    ? new Map((await db.select().from(applicationSources).where(inArray(applicationSources.id, sourceIds))).map((s) => [s.id, s.name]))
    : new Map()

  const headers = [
    "posisi", "perusahaan", "lokasi", "sistem_kerja", "jenis_pekerjaan", "level",
    "sumber", "url_lowongan", "status", "prioritas", "gaji_min", "gaji_max",
    "mata_uang", "periode_gaji", "tanggal_ditemukan", "tanggal_melamar",
    "deadline", "alasan_penolakan", "alasan_penarikan", "catatan", "diarsipkan",
  ]

  const rows = apps.map((a) => [
    a.positionTitle,
    a.companyId ? companyMap.get(a.companyId) ?? "" : "",
    a.location,
    a.workMode,
    a.employmentType,
    a.seniorityLevel,
    a.sourceId ? sourceMap.get(a.sourceId) ?? "" : "",
    a.jobUrl,
    a.status,
    a.priority,
    a.salaryMin,
    a.salaryMax,
    a.salaryCurrency,
    a.salaryPeriod,
    a.foundAt,
    a.appliedAt,
    a.deadlineAt,
    a.rejectionReason,
    a.withdrawalReason,
    a.notes,
    a.isArchived ? "ya" : "tidak",
  ])

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\n")

  const filename = `lamaran-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}