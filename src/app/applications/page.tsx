import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { jobApplications, companies, applicationSources } from "@/lib/db/schema"
import { and, eq, inArray, isNull, or, like, desc, asc, sql, count } from "drizzle-orm"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ApplicationsListClient } from "./applications-list-client"
import { getUserCompanies } from "@/lib/queries"

export const metadata = { title: "Applications — JobTracker" }

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; group?: string; company?: string; sort?: string; archived?: string; page?: string }>
}) {
  const userId = await requireUserId()
  const params = await searchParams
  const userCompanies = await getUserCompanies(userId)

  // Build query
  const conditions = [
    eq(jobApplications.userId, userId),
    isNull(jobApplications.deletedAt),
  ]

  const showArchived = params.archived === "1"
  if (!showArchived) conditions.push(eq(jobApplications.isArchived, false))

  if (params.q) {
    const q = `%${params.q}%`
    conditions.push(
      or(
        like(jobApplications.positionTitle, q),
        like(jobApplications.location, q),
        like(jobApplications.notes, q),
      )!
    )
  }
  if (params.status) conditions.push(eq(jobApplications.status, params.status))
  if (params.company) conditions.push(eq(jobApplications.companyId, params.company))
  if (params.group === "active") {
    conditions.push(sql`${jobApplications.status} in ('Applied','Screening','Assessment','HR Interview','User Interview','Final Interview','Offering')`)
  }
  if (params.group === "finished") {
    conditions.push(sql`${jobApplications.status} in ('Accepted','Rejected','Withdrawn','No Response')`)
  }

  const sortField = params.sort ?? "newest"
  const orderBy = sortField === "oldest" ? asc(jobApplications.createdAt)
    : sortField === "updated" ? desc(jobApplications.updatedAt)
    : sortField === "applied" ? desc(jobApplications.appliedAt)
    : desc(jobApplications.createdAt)

  // Pagination
  const page = Math.max(1, Number(params.page) || 1)
  const perPage = 25
  const offset = (page - 1) * perPage

  const [totalResult] = await db.select({ total: count() }).from(jobApplications).where(and(...conditions))
  const total = totalResult.total
  const totalPages = Math.ceil(total / perPage)

  const rows = await db.select({
    id: jobApplications.id,
    positionTitle: jobApplications.positionTitle,
    companyId: jobApplications.companyId,
    location: jobApplications.location,
    workMode: jobApplications.workMode,
    employmentType: jobApplications.employmentType,
    status: jobApplications.status,
    priority: jobApplications.priority,
    salaryMin: jobApplications.salaryMin,
    salaryMax: jobApplications.salaryMax,
    salaryCurrency: jobApplications.salaryCurrency,
    salaryPeriod: jobApplications.salaryPeriod,
    appliedAt: jobApplications.appliedAt,
    deadlineAt: jobApplications.deadlineAt,
    jobUrl: jobApplications.jobUrl,
    isArchived: jobApplications.isArchived,
    createdAt: jobApplications.createdAt,
  })
    .from(jobApplications)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(perPage)
    .offset(offset)

  // Batch load companies
  const companyIds = [...new Set(rows.map((r) => r.companyId).filter(Boolean))] as string[]
  const companyMap = companyIds.length > 0
    ? new Map((await db.select().from(companies).where(inArray(companies.id, companyIds))).map((c) => [c.id, c]))
    : new Map()

  const rowsWithCompany = rows.map((r) => ({
    ...r,
    isArchived: r.isArchived ?? false,
    company: r.companyId ? companyMap.get(r.companyId) ?? null : null,
  }))

  return (
    <DashboardLayout>
      <ApplicationsListClient
        rows={rowsWithCompany}
        companies={userCompanies}
        params={{
          q: params.q ?? "",
          status: params.status ?? "",
          sort: params.sort ?? "newest",
          archived: params.archived === "1",
          page,
          totalPages,
          total,
        }}
      />
    </DashboardLayout>
  )
}