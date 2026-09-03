import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { and, eq, isNull } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const [doc] = await db.select().from(documents)
    .where(and(
      eq(documents.id, id),
      eq(documents.userId, session.user.id),
      isNull(documents.deletedAt),
    ))
    .limit(1)

  if (!doc) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 })
  }

  // Redirect ke signed URL private blob
  return NextResponse.redirect(doc.blobKey)
}
