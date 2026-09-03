"use server"

import { getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { contacts, applicationContacts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { contactSchema } from "@/lib/validations"

async function requireUser() {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

export async function createContact(input: unknown) {
  const userId = await requireUser()
  const parsed = contactSchema.parse(input)
  const [contact] = await db.insert(contacts).values({
    userId,
    companyId: parsed.companyId ?? null,
    name: parsed.name,
    jobTitle: parsed.jobTitle ?? null,
    email: parsed.email || null,
    phone: parsed.phone ?? null,
    linkedinUrl: parsed.linkedinUrl || null,
    notes: parsed.notes ?? null,
  }).returning()
  revalidatePath("/contacts")
  return { id: contact.id }
}

export async function updateContact(id: string, input: unknown) {
  const userId = await requireUser()
  const parsed = contactSchema.parse(input)
  await db.update(contacts).set({
    companyId: parsed.companyId ?? null,
    name: parsed.name,
    jobTitle: parsed.jobTitle ?? null,
    email: parsed.email || null,
    phone: parsed.phone ?? null,
    linkedinUrl: parsed.linkedinUrl || null,
    notes: parsed.notes ?? null,
    updatedAt: new Date(),
  }).where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
  revalidatePath("/contacts")
}

export async function deleteContact(id: string) {
  const userId = await requireUser()
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
  revalidatePath("/contacts")
}

export async function linkContactToApplication(applicationId: string, contactId: string, role?: string) {
  const userId = await requireUser()
  await db.insert(applicationContacts).values({ applicationId, contactId, role: role ?? null })
  revalidatePath(`/applications/${applicationId}`)
}
