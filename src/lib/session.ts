import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DEMO_USER_ID } from "@/lib/constants"

// Mode lokal tanpa DATABASE_URL = single-user demo: semua aksi berjalan
// sebagai user demo tanpa perlu login. Saat DATABASE_URL tersedia
// (deploy/produksi), autentikasi Google aktif seperti biasa.
export function isNoAuthMode(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.DATABASE_URL
}

export const demoUser = {
  id: DEMO_USER_ID,
  name: "Hilal (Demo)",
  email: "demo@jobtracker.local",
  image: null as string | null,
}

export async function requireUserId(): Promise<string> {
  if (isNoAuthMode()) return DEMO_USER_ID
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session.user.id
}

// Untuk route handler — null jika tidak terautentikasi (tanpa redirect)
export async function getUserId(): Promise<string | null> {
  if (isNoAuthMode()) return DEMO_USER_ID
  const session = await auth()
  return session?.user?.id ?? null
}

export async function getSessionUser() {
  if (isNoAuthMode()) return demoUser
  const session = await auth()
  return session?.user ?? null
}
