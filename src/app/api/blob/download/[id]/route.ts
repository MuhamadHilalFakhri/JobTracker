import { NextRequest, NextResponse } from "next/server"
import { getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { and, eq, isNull } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const [doc] = await db.select().from(documents)
    .where(and(
      eq(documents.id, id),
      eq(documents.userId, userId),
      isNull(documents.deletedAt),
    ))
    .limit(1)

  if (!doc) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 })
  }

  // Redirect ke signed URL private blob
  return NextResponse.redirect(doc.blobKey)
}
