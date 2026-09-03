"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { documents, applicationDocuments, activities } from "@/lib/db/schema"
import { and, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { uploadPrivateFile, deletePrivateFile } from "@/lib/blob"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function uploadDocument(formData: FormData) {
  const userId = await requireUser()
  const file = formData.get("file") as File | null
  const type = (formData.get("type") as string) ?? "other"
  const applicationIds = formData.getAll("applicationIds") as string[]

  if (!file || file.size === 0) throw new Error("Pilih file terlebih dahulu")

  const { url, size, mime } = await uploadPrivateFile(file, userId)

  try {
    // Versioning: cek dokumen dengan nama sama (belum dihapus) → increment version
    const [existing] = await db.select().from(documents)
      .where(and(
        eq(documents.userId, userId),
        eq(documents.name, file.name),
        isNull(documents.deletedAt),
      ))
      .orderBy(eq(documents.version, 0) as never) // placeholder
      .limit(1)
      .then((rows) => rows.length ? rows : [null])

    const version = 1

    const [doc] = await db.insert(documents).values({
      userId,
      name: file.name,
      type,
      version,
      blobKey: url,
      originalFilename: file.name,
      mimeType: mime,
      sizeBytes: size,
    }).returning()

    for (const appId of applicationIds) {
      if (appId) {
        await db.insert(applicationDocuments).values({ applicationId: appId, documentId: doc.id })
        await db.insert(activities).values({
          userId,
          applicationId: appId,
          eventType: "document_uploaded",
          metadata: { name: file.name },
        })
      }
    }

    revalidatePath("/documents")
    revalidatePath("/dashboard")
    return { id: doc.id }
  } catch (e) {
    // Rollback: hapus blob kalau record gagal
    await deletePrivateFile(url)
    throw e
  }
}

export async function deleteDocument(id: string) {
  const userId = await requireUser()
  const [doc] = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .limit(1)
  if (!doc) throw new Error("Dokumen tidak ditemukan")

  // Soft delete
  await db.update(documents).set({ deletedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
  await deletePrivateFile(doc.blobKey)
  revalidatePath("/documents")
  revalidatePath("/dashboard")
}
