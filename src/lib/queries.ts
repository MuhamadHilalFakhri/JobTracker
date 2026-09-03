import { db } from "@/lib/db"
import {
  jobApplications, companies, applicationSources, contacts,
  applicationContacts, interviews, tasks, documents, applicationDocuments,
  notes, applicationStatusHistories, activities,
} from "@/lib/db/schema"
import { and, eq, inArray, desc, asc, isNull, sql } from "drizzle-orm"

export type ApplicationWithRelations = typeof jobApplications.$inferSelect & {
  company: typeof companies.$inferSelect | null
  source: typeof applicationSources.$inferSelect | null
  interviews: (typeof interviews.$inferSelect)[]
  tasks: (typeof tasks.$inferSelect)[]
}

export async function getApplicationWithRelations(userId: string, id: string) {
  const [app] = await db.select().from(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId), isNull(jobApplications.deletedAt)))
    .limit(1)
  if (!app) return null

  const [company] = app.companyId
    ? await db.select().from(companies).where(eq(companies.id, app.companyId)).limit(1)
    : [null]

  const [source] = app.sourceId
    ? await db.select().from(applicationSources).where(eq(applicationSources.id, app.sourceId)).limit(1)
    : [null]

  const appInterviews = await db.select().from(interviews)
    .where(and(eq(interviews.applicationId, id), eq(interviews.userId, userId)))
    .orderBy(asc(interviews.startAt))

  const appTasks = await db.select().from(tasks)
    .where(and(eq(tasks.applicationId, id), eq(tasks.userId, userId)))
    .orderBy(asc(tasks.dueAt))

  const appContacts = await db.select({
    contact: contacts,
    role: applicationContacts.role,
  })
    .from(applicationContacts)
    .innerJoin(contacts, eq(contacts.id, applicationContacts.contactId))
    .where(and(eq(applicationContacts.applicationId, id), eq(contacts.userId, userId)))

  const appDocuments = await db.select({
    document: documents,
    usageType: applicationDocuments.usageType,
  })
    .from(applicationDocuments)
    .innerJoin(documents, eq(documents.id, applicationDocuments.documentId))
    .where(and(eq(applicationDocuments.applicationId, id), eq(documents.userId, userId), isNull(documents.deletedAt)))

  const appNotes = await db.select().from(notes)
    .where(and(eq(notes.applicationId, id), eq(notes.userId, userId)))
    .orderBy(desc(notes.createdAt))

  const history = await db.select().from(applicationStatusHistories)
    .where(eq(applicationStatusHistories.applicationId, id))
    .orderBy(asc(applicationStatusHistories.changedAt))

  const timeline = await db.select().from(activities)
    .where(and(eq(activities.applicationId, id), eq(activities.userId, userId)))
    .orderBy(desc(activities.createdAt))

  return {
    ...app,
    company, source, interviews: appInterviews, tasks: appTasks,
    contacts: appContacts, documents: appDocuments, notes: appNotes,
    history, timeline,
  }
}

export async function getApplicationsForKanban(userId: string) {
  const rows = await db.select().from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.isArchived, false), isNull(jobApplications.deletedAt)))
    .orderBy(desc(jobApplications.lastActivityAt))

  const companyIds = [...new Set(rows.map((r) => r.companyId).filter(Boolean))] as string[]
  const sourceIds = [...new Set(rows.map((r) => r.sourceId).filter(Boolean))] as string[]

  const companiesMap = companyIds.length > 0
    ? new Map((await db.select().from(companies).where(inArray(companies.id, companyIds))).map((c) => [c.id, c]))
    : new Map()
  const sourcesMap = sourceIds.length > 0
    ? new Map((await db.select().from(applicationSources).where(inArray(applicationSources.id, sourceIds))).map((s) => [s.id, s]))
    : new Map()

  return rows.map((app) => ({
    ...app,
    company: app.companyId ? companiesMap.get(app.companyId) ?? null : null,
    source: app.sourceId ? sourcesMap.get(app.sourceId) ?? null : null,
  }))
}

export async function getUserCompanies(userId: string) {
  return db.select().from(companies)
    .where(and(eq(companies.userId, userId), isNull(companies.deletedAt)))
    .orderBy(asc(companies.name))
}

export async function getUserSources(userId: string) {
  return db.select().from(applicationSources)
    .where(eq(applicationSources.userId, userId))
    .orderBy(asc(applicationSources.name))
}

export async function getUpcomingInterviews(userId: string, limit = 10) {
  const now = new Date()
  return db.select().from(interviews)
    .where(and(eq(interviews.userId, userId), sql`${interviews.startAt} >= ${now}`))
    .orderBy(asc(interviews.startAt))
    .limit(limit)
}

export async function getRecentTasks(userId: string, limit = 10) {
  return db.select().from(tasks)
    .where(and(eq(tasks.userId, userId), sql`${tasks.status} != 'Completed'`))
    .orderBy(asc(tasks.dueAt))
    .limit(limit)
}

export async function getDashboardCounts(userId: string) {
  const [totalRow] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where status in ('Applied','Screening','Assessment','HR Interview','User Interview','Final Interview','Offering'))`,
    offering: sql<number>`count(*) filter (where status = 'Offering')`,
    accepted: sql<number>`count(*) filter (where status = 'Accepted')`,
    rejected: sql<number>`count(*) filter (where status = 'Rejected')`,
    noResponse: sql<number>`count(*) filter (where status = 'No Response')`,
  }).from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.isArchived, false), isNull(jobApplications.deletedAt)))

  const upcoming = await getUpcomingInterviews(userId, 5)
  const tasks = await getRecentTasks(userId, 5)

  return { ...totalRow, upcomingInterviews: upcoming, recentTasks: tasks }
}
