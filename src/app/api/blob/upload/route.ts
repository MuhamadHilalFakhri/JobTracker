import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { uploadDocument } from "@/app/actions/documents"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
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
