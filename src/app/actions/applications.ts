"use server"

import { getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import {
  jobApplications, companies, applicationSources, applicationStatusHistories,
  activities, applicationContacts, applicationDocuments,
} from "@/lib/db/schema"
import { and, eq, ne, isNull, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { applicationSchema } from "@/lib/validations"
import { requiresAppliedDate, isTerminal, STATUSES } from "@/lib/status"
import { slugify } from "@/lib/utils"

function parseDate(v?: string | null): Date | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

async function requireUser() {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

export type ApplicationInput = {
  positionTitle: string
  companyId?: string | null
  companyName?: string
  location?: string
  workMode?: string | null
  employmentType?: string | null
  seniorityLevel?: string | null
  sourceId?: string | null
  sourceName?: string
  jobUrl?: string
  jobDescription?: string
  jobRequirements?: string
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string
  salaryPeriod?: string | null
  status?: string
  priority?: string
  foundAt?: string | null
  appliedAt?: string | null
  deadlineAt?: string | null
  notes?: string
}

export async function createApplication(input: ApplicationInput) {
  const userId = await requireUser()
  const parsed = applicationSchema.parse(input)

  // Resolve atau buat company
  let companyId: string | null = parsed.companyId ?? null
  if (parsed.companyName?.trim()) {
    const existing = await db.select().from(companies)
      .where(and(eq(companies.userId, userId), eq(companies.name, parsed.companyName.trim())))
      .limit(1)
    if (existing.length > 0) {
      companyId = existing[0].id
    } else {
      const [c] = await db.insert(companies).values({
        userId, name: parsed.companyName.trim(), slug: slugify(parsed.companyName),
      }).returning()
      companyId = c.id
    }
  }

  // Resolve atau buat source
  let sourceId: string | null = parsed.sourceId ?? null
  if (!sourceId && parsed.sourceName?.trim()) {
    const [s] = await db.insert(applicationSources).values({
      userId, name: parsed.sourceName.trim(),
    }).returning()
    sourceId = s.id
  }

  const appliedAt = parseDate(parsed.appliedAt)

  const [app] = await db.insert(jobApplications).values({
    userId,
    companyId,
    positionTitle: parsed.positionTitle,
    location: parsed.location ?? null,
    workMode: parsed.workMode ?? null,
    employmentType: parsed.employmentType ?? null,
    seniorityLevel: parsed.seniorityLevel ?? null,
    sourceId,
    jobUrl: parsed.jobUrl || null,
    jobDescription: parsed.jobDescription ?? null,
    jobRequirements: parsed.jobRequirements ?? null,
    salaryMin: parsed.salaryMin ?? null,
    salaryMax: parsed.salaryMax ?? null,
    salaryCurrency: parsed.salaryCurrency ?? "IDR",
    salaryPeriod: parsed.salaryPeriod ?? "Bulanan",
    status: parsed.status,
    priority: parsed.priority,
    foundAt: parseDate(parsed.foundAt),
    appliedAt,
    deadlineAt: parseDate(parsed.deadlineAt),
    notes: parsed.notes ?? null,
    lastActivityAt: new Date(),
  }).returning()

  await db.insert(applicationStatusHistories).values({
    applicationId: app.id,
    fromStatus: null,
    toStatus: parsed.status,
    changedAt: new Date(),
  })

  await db.insert(activities).values({
    userId,
    applicationId: app.id,
    eventType: "application_created",
    metadata: { position: parsed.positionTitle },
  })

  revalidatePath("/applications")
  revalidatePath("/kanban")
  revalidatePath("/dashboard")
  return { id: app.id }
}

export async function updateApplication(id: string, input: ApplicationInput) {
  const userId = await requireUser()
  const parsed = applicationSchema.parse(input)

  const existing = await db.select().from(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .limit(1)
  if (existing.length === 0) throw new Error("Lamaran tidak ditemukan")

  // Business rule: appliedAt wajib saat status >= Applied
  if (requiresAppliedDate(parsed.status) && !parseDate(parsed.appliedAt)) {
    throw new Error("Tanggal melamar wajib diisi ketika status berpindah ke Applied atau setelahnya")
  }

  // Company resolution
  let companyId = parsed.companyId ?? existing[0].companyId
  if (parsed.companyName?.trim() && !parsed.companyId) {
    const existingCompany = await db.select().from(companies)
      .where(and(eq(companies.userId, userId), eq(companies.name, parsed.companyName.trim())))
      .limit(1)
    if (existingCompany.length > 0) companyId = existingCompany[0].id
    else {
      const [c] = await db.insert(companies).values({
        userId, name: parsed.companyName.trim(), slug: slugify(parsed.companyName),
      }).returning()
      companyId = c.id
    }
  }

  let sourceId = parsed.sourceId ?? existing[0].sourceId
  if (!sourceId && parsed.sourceName?.trim()) {
    const [s] = await db.insert(applicationSources).values({
      userId, name: parsed.sourceName.trim(),
    }).returning()
    sourceId = s.id
  }

  // Status change detection
  const statusChanged = existing[0].status !== parsed.status
  const prevStatus = existing[0].status

  const [updated] = await db.update(jobApplications)
    .set({
      companyId,
      positionTitle: parsed.positionTitle,
      location: parsed.location ?? null,
      workMode: parsed.workMode ?? null,
      employmentType: parsed.employmentType ?? null,
      seniorityLevel: parsed.seniorityLevel ?? null,
      sourceId,
      jobUrl: parsed.jobUrl || null,
      jobDescription: parsed.jobDescription ?? null,
      jobRequirements: parsed.jobRequirements ?? null,
      salaryMin: parsed.salaryMin ?? null,
      salaryMax: parsed.salaryMax ?? null,
      salaryCurrency: parsed.salaryCurrency ?? "IDR",
      salaryPeriod: parsed.salaryPeriod ?? "Bulanan",
      status: parsed.status,
      priority: parsed.priority,
      foundAt: parseDate(parsed.foundAt),
      appliedAt: parseDate(parsed.appliedAt),
      deadlineAt: parseDate(parsed.deadlineAt),
      notes: parsed.notes ?? null,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning()

  if (statusChanged) {
    await db.insert(applicationStatusHistories).values({
      applicationId: id,
      fromStatus: prevStatus,
      toStatus: parsed.status,
      changedAt: new Date(),
    })
    await db.insert(activities).values({
      userId,
      applicationId: id,
      eventType: "application_status_changed",
      metadata: { from: prevStatus, to: parsed.status },
    })
  }

  revalidatePath("/applications")
  revalidatePath(`/applications/${id}`)
  revalidatePath("/kanban")
  revalidatePath("/dashboard")
  return updated
}

export async function changeApplicationStatus(id: string, toStatus: string, reason?: string, note?: string) {
  const userId = await requireUser()
  if (!STATUSES.includes(toStatus as (typeof STATUSES)[number])) throw new Error("Status tidak valid")

  const existing = await db.select().from(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .limit(1)
  if (existing.length === 0) throw new Error("Lamaran tidak ditemukan")

  const prev = existing[0].status
  if (prev === toStatus) return

  // Business rules
  if (requiresAppliedDate(toStatus) && !existing[0].appliedAt) {
    throw new Error("Tanggal melamar wajib diisi ketika status berpindah ke Applied atau setelahnya")
  }
  if (toStatus === "Rejected" && !reason?.trim()) {
    throw new Error("Alasan penolakan wajib diisi")
  }
  if (toStatus === "Withdrawn" && !reason?.trim()) {
    throw new Error("Alasan penarikan wajib diisi")
  }

  await db.transaction(async (tx) => {
    const values: Record<string, unknown> = {
      status: toStatus,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    }
    if (toStatus === "Rejected") values.rejectionReason = reason ?? null
    if (toStatus === "Withdrawn") values.withdrawalReason = reason ?? null

    await tx.update(jobApplications)
      .set(values)
      .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))

    await tx.insert(applicationStatusHistories).values({
      applicationId: id,
      fromStatus: prev,
      toStatus,
      note: note ?? reason ?? null,
      changedAt: new Date(),
    })

    await tx.insert(activities).values({
      userId,
      applicationId: id,
      eventType: "application_status_changed",
      metadata: { from: prev, to: toStatus, reason: reason ?? null },
    })
  })

  revalidatePath("/applications")
  revalidatePath(`/applications/${id}`)
  revalidatePath("/kanban")
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
}

export async function archiveApplication(id: string, archived = true) {
  const userId = await requireUser()
  await db.update(jobApplications)
    .set({ isArchived: archived, updatedAt: new Date(), lastActivityAt: new Date() })
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
  await db.insert(activities).values({
    userId,
    applicationId: id,
    eventType: archived ? "application_archived" : "application_restored",
  })
  revalidatePath("/applications")
  revalidatePath(`/applications/${id}`)
  revalidatePath("/kanban")
}

export async function deleteApplication(id: string) {
  const userId = await requireUser()
  await db.delete(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
  revalidatePath("/applications")
  revalidatePath("/kanban")
  revalidatePath("/dashboard")
  redirect("/applications")
}

export async function duplicateApplication(id: string) {
  const userId = await requireUser()
  const existing = await db.select().from(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .limit(1)
  if (existing.length === 0) throw new Error("Lamaran tidak ditemukan")

  const src = existing[0]
  const [copy] = await db.insert(jobApplications).values({
    userId,
    companyId: src.companyId,
    positionTitle: src.positionTitle,
    location: src.location,
    workMode: src.workMode,
    employmentType: src.employmentType,
    seniorityLevel: src.seniorityLevel,
    sourceId: src.sourceId,
    jobUrl: src.jobUrl,
    jobDescription: src.jobDescription,
    jobRequirements: src.jobRequirements,
    salaryMin: src.salaryMin,
    salaryMax: src.salaryMax,
    salaryCurrency: src.salaryCurrency,
    salaryPeriod: src.salaryPeriod,
    status: "Wishlist",
    priority: src.priority,
    foundAt: new Date(),
    notes: `(Duplikat dari ${src.positionTitle})`,
    lastActivityAt: new Date(),
  }).returning()

  await db.insert(applicationStatusHistories).values({
    applicationId: copy.id, fromStatus: null, toStatus: "Wishlist",
  })
  revalidatePath("/applications")
  revalidatePath("/kanban")
  return { id: copy.id }
}

export async function deleteApplicationHard(id: string) {
  const userId = await requireUser()
  await db.delete(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
  revalidatePath("/applications")
  revalidatePath("/kanban")
  redirect("/applications")
}
