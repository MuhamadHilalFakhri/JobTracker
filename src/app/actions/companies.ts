"use server"

import { getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { companies, contacts, jobApplications } from "@/lib/db/schema"
import { and, eq, ilike } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { companySchema } from "@/lib/validations"
import { slugify } from "@/lib/utils"

async function requireUser() {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

export async function findSimilarCompanies(name: string) {
  const userId = await requireUser()
  if (!name.trim()) return []
  return db.select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(and(eq(companies.userId, userId), ilike(companies.name, `%${name.trim()}%`)))
    .limit(5)
}

export async function createCompany(input: unknown) {
  const userId = await requireUser()
  const parsed = companySchema.parse(input)
  const [company] = await db.insert(companies).values({
    userId,
    name: parsed.name,
    slug: slugify(parsed.name),
    industry: parsed.industry ?? null,
    companySize: parsed.companySize ?? null,
    websiteUrl: parsed.websiteUrl || null,
    linkedinUrl: parsed.linkedinUrl || null,
    location: parsed.location ?? null,
    description: parsed.description ?? null,
    cultureNotes: parsed.cultureNotes ?? null,
    interestRating: parsed.interestRating ?? null,
  }).returning()
  revalidatePath("/companies")
  return { id: company.id }
}

export async function updateCompany(id: string, input: unknown) {
  const userId = await requireUser()
  const parsed = companySchema.parse(input)
  await db.update(companies).set({
    name: parsed.name,
    slug: slugify(parsed.name),
    industry: parsed.industry ?? null,
    companySize: parsed.companySize ?? null,
    websiteUrl: parsed.websiteUrl || null,
    linkedinUrl: parsed.linkedinUrl || null,
    location: parsed.location ?? null,
    description: parsed.description ?? null,
    cultureNotes: parsed.cultureNotes ?? null,
    interestRating: parsed.interestRating ?? null,
    updatedAt: new Date(),
  }).where(and(eq(companies.id, id), eq(companies.userId, userId)))
  revalidatePath("/companies")
  revalidatePath(`/companies/${id}`)
}

export async function deleteCompany(id: string) {
  const userId = await requireUser()
  // Cek apakah masih dipakai lamaran / kontak
  const apps = await db.select({ id: jobApplications.id })
    .from(jobApplications)
    .where(and(eq(jobApplications.companyId, id), eq(jobApplications.userId, userId)))
    .limit(1)
  const cts = await db.select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.companyId, id), eq(contacts.userId, userId)))
    .limit(1)
  if (apps.length > 0 || cts.length > 0) {
    throw new Error("Perusahaan masih digunakan oleh lamaran atau kontak. Putuskan relasinya dulu.")
  }
  await db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)))
  revalidatePath("/companies")
}
