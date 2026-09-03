import { NextRequest, NextResponse } from "next/server"
import { getUserId } from "@/lib/session"
import { uploadDocument } from "@/app/actions/documents"

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const formData = await req.formData()
    const result = await uploadDocument(formData)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload gagal" },
      { status: 400 }
    )
  }
}
