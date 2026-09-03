import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { jobApplications, interviews, tasks, activities, companies } from "@/lib/db/schema"
import { and, eq, isNull, gte, desc, sql, asc } from "drizzle-orm"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { ApplicationFormDialog } from "@/components/application-form"
import { DashboardCharts } from "./charts"
import {
  Briefcase, Activity, CalendarClock, TrendingUp, CheckCircle2,
  XCircle, Plus, ArrowRight, Bell,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { getUserCompanies } from "@/lib/queries"

export const metadata = { title: "Dashboard — JobTracker" }

export default async function DashboardPage() {
  const userId = await requireUserId()
  const userCompanies = await getUserCompanies(userId)

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where status in ('Applied','Screening','Assessment','HR Interview','User Interview','Final Interview','Offering'))`,
    offering: sql<number>`count(*) filter (where status = 'Offering')`,
    accepted: sql<number>`count(*) filter (where status = 'Accepted')`,
    rejected: sql<number>`count(*) filter (where status = 'Rejected')`,
    noResponse: sql<number>`count(*) filter (where status = 'No Response')`,
  }).from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.isArchived, false), isNull(jobApplications.deletedAt)))

  const upcomingInterviews = await db.select({
    id: interviews.id,
    title: interviews.title,
    startAt: interviews.startAt,
    mode: interviews.mode,
    meetingUrl: interviews.meetingUrl,
    applicationId: interviews.applicationId,
    positionTitle: jobApplications.positionTitle,
  }).from(interviews)
    .leftJoin(jobApplications, eq(jobApplications.id, interviews.applicationId))
    .where(and(eq(interviews.userId, userId), gte(interviews.startAt, new Date()), sql`${interviews.status} = 'Scheduled'`))
    .orderBy(asc(interviews.startAt))
    .limit(5)

  const recentTasks = await db.select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), sql`${tasks.status} != 'Completed'`))
    .orderBy(asc(tasks.dueAt))
    .limit(5)

  const recentActivities = await db.select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.createdAt))
    .limit(8)

  // Status distribution untuk chart
  const statusDist = await db.select({
    status: jobApplications.status,
    count: sql<number>`count(*)`,
  }).from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.isArchived, false), isNull(jobApplications.deletedAt)))
    .groupBy(jobApplications.status)

  // Lamaran per minggu (12 minggu terakhir)
  const weekly = await db.select({
    week: sql<string>`to_char(date_trunc('week', ${jobApplications.createdAt}), 'YYYY-MM-DD')`,
    count: sql<number>`count(*)`,
  }).from(jobApplications)
    .where(and(
      eq(jobApplications.userId, userId),
      isNull(jobApplications.deletedAt),
      gte(jobApplications.createdAt, sql`now() - interval '12 weeks'`),
    ))
    .groupBy(sql`date_trunc('week', ${jobApplications.createdAt})`)
    .orderBy(sql`date_trunc('week', ${jobApplications.createdAt})`)

  const hasData = stats.total > 0

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Ringkasan pencarian kerja kamu</p>
          </div>
          <ApplicationFormDialog companies={userCompanies} trigger={
            <Button><Plus className="mr-2 h-4 w-4" />Tambah Lamaran</Button>
          } />
        </div>

        {!hasData ? (
          <EmptyState
            icon={<Briefcase className="h-10 w-10" />}
            title="Mulai lacak lamaran pertamamu"
            description="Catat lowongan yang ditemukan, pantau statusnya, dan lihat statistik pencarian kerja kamu di sini."
            action={
              <ApplicationFormDialog companies={userCompanies} trigger={
                <Button size="lg"><Plus className="mr-2 h-4 w-4" />Tambah Lamaran Pertama</Button>
              } />
            }
          />
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Lamaran</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Number(stats.total)}</div>
                  <p className="text-xs text-muted-foreground">{Number(stats.active)} aktif</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interview Mendatang</CardTitle>
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{upcomingInterviews.length}</div>
                  <p className="text-xs text-muted-foreground">7 hari ke depan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Offering</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Number(stats.offering)}</div>
                  <p className="text-xs text-muted-foreground">{Number(stats.accepted)} diterima</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Number(stats.rejected)}</div>
                  <p className="text-xs text-muted-foreground">{Number(stats.noResponse)} tanpa respons</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <DashboardCharts
  statusDist={statusDist.map((s) => ({ status: s.status, count: Number(s.count) }))}
  weekly={weekly.map((w) => ({ week: w.week, count: Number(w.count) }))}
/>

            {/* Lists */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Upcoming interviews */}
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Agenda Terdekat</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/calendar">Lihat semua</a>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingInterviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada interview terjadwal</p>
                  ) : (
                    upcomingInterviews.map((iv) => (
                      <div key={iv.id} className="flex items-start justify-between rounded-lg border p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{iv.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{iv.positionTitle}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(iv.startAt)}</p>
                        </div>
                        {iv.meetingUrl && (
                          <a href={iv.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                            Gabung
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Task Aktif</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {recentTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada task aktif</p>
                  ) : (
                    recentTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border p-2.5">
                        <span className="truncate text-sm">{t.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDateTime(t.dueAt)}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent activities */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Aktivitas Terbaru</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {recentActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
                  ) : (
                    recentActivities.map((a) => (
                      <div key={a.id} className="text-sm">
                        <p className="text-muted-foreground">{a.eventType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}