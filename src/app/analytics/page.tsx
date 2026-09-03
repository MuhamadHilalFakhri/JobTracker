import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { jobApplications, companies } from "@/lib/db/schema"
import { and, eq, isNull, sql } from "drizzle-orm"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsCharts } from "./analytics-charts"

export const metadata = { title: "Analytics — JobTracker" }

export default async function AnalyticsPage() {
  const userId = await requireUserId()

  const [totals] = await db.select({
    total: sql<number>`count(*)`,
    applied: sql<number>`count(*) filter (where applied_at is not null)`,
    screening: sql<number>`count(*) filter (where status in ('Screening','Assessment','HR Interview','User Interview','Final Interview','Offering','Accepted'))`,
    interviews: sql<number>`count(*) filter (where status in ('HR Interview','User Interview','Final Interview','Offering','Accepted'))`,
    offering: sql<number>`count(*) filter (where status in ('Offering','Accepted'))`,
    accepted: sql<number>`count(*) filter (where status = 'Accepted')`,
    rejected: sql<number>`count(*) filter (where status = 'Rejected')`,
    noResponse: sql<number>`count(*) filter (where status = 'No Response')`,
  }).from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), isNull(jobApplications.deletedAt)))

  // Sumber lowongan paling efektif
  const bySource = await db.select({
    source: jobApplications.sourceId,
    total: sql<number>`count(*)`,
    responded: sql<number>`count(*) filter (where status != 'Applied' and applied_at is not null)`,
  }).from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), isNull(jobApplications.deletedAt), sql`source_id is not null`))
    .groupBy(jobApplications.sourceId)

  // Posisi & work mode paling sering
  const byWorkMode = await db.select({
    workMode: jobApplications.workMode,
    count: sql<number>`count(*)`,
  }).from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), isNull(jobApplications.deletedAt)))
    .groupBy(jobApplications.workMode)

  const byEmployment = await db.select({
    employmentType: jobApplications.employmentType,
    count: sql<number>`count(*)`,
  }).from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), isNull(jobApplications.deletedAt)))
    .groupBy(jobApplications.employmentType)

  // Alasan penolakan
  const rejectionReasons = await db.select({
    reason: jobApplications.rejectionReason,
    count: sql<number>`count(*)`,
  }).from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.status, "Rejected"), sql`rejection_reason is not null`))
    .groupBy(jobApplications.rejectionReason)
    .orderBy(sql`count(*) desc`)
    .limit(10)

  // Rata-rata waktu respons (applied → status berubah pertama kali)
  const avgResponse = await db.select({
    avgDays: sql<number>`coalesce(avg(extract(epoch from (updated_at - applied_at)) / 86400), 0)`,
  }).from(jobApplications)
    .where(and(
      eq(jobApplications.userId, userId),
      sql`applied_at is not null and status not in ('Wishlist','Preparing') and status != 'Applied'`,
    ))

  const rate = (num: unknown, den: unknown) => {
    const n = Number(num), d = Number(den)
    return d === 0 ? "0%" : `${((n / d) * 100).toFixed(0)}%`
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Evaluasi efektivitas strategi melamar kerja</p>
        </div>

        {/* Rates */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Response Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rate(totals.screening, totals.applied)}</div>
              <p className="text-xs text-muted-foreground">{Number(totals.screening)} dari {Number(totals.applied)} lamaran</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Interview Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rate(totals.interviews, totals.applied)}</div>
              <p className="text-xs text-muted-foreground">{Number(totals.interviews)} dari {Number(totals.applied)} lamaran</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Offer Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rate(totals.offering, totals.applied)}</div>
              <p className="text-xs text-muted-foreground">{Number(totals.offering)} dari {Number(totals.applied)} lamaran</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rata-rata Respons</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Number(avgResponse[0]?.avgDays ?? 0).toFixed(1)} hari</div>
              <p className="text-xs text-muted-foreground">sejak melamar</p>
            </CardContent>
          </Card>
        </div>

        <AnalyticsCharts
          byWorkMode={byWorkMode.filter((w) => w.workMode).map((w) => ({ name: w.workMode!, count: Number(w.count) }))}
          byEmployment={byEmployment.filter((e) => e.employmentType).map((e) => ({ name: e.employmentType!, count: Number(e.count) }))}
          rejectionReasons={rejectionReasons.filter((r) => r.reason).map((r) => ({ reason: r.reason!, count: Number(r.count) }))}
        />

        {/* Rejection reasons list */}
        {rejectionReasons.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Alasan Penolakan Teratas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rejectionReasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate">{r.reason}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{Number(r.count)}×</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}