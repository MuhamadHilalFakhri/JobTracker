import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session.user.id
}

export async function getSessionUser() {
  const session = await auth()
  return session?.user ?? null
}
