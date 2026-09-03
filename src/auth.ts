import NextAuth, { type NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const providers: NonNullable<NextAuthConfig["providers"]> = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google)
}

// Demo login — HANYA aktif saat dev tanpa DATABASE_URL (mode PGlite lokal).
const isLocalDev =
  process.env.NODE_ENV === "development" && !process.env.DATABASE_URL

if (isLocalDev) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      async authorize() {
        const email = "demo@jobtracker.local"
        let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user) {
          ;[user] = await db
            .insert(users)
            .values({ id: "demo-user", name: "Hilal (Demo)", email })
            .returning()
        }
        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials provider TIDAK mendukung database session — pakai JWT.
  // Saat produksi (Google OAuth + Neon), fallback ke database session.
  adapter: isLocalDev ? undefined : DrizzleAdapter(db),
  session: isLocalDev ? { strategy: "jwt" } : { strategy: "database" },
  providers,
  callbacks: {
    session({ session, token, user }) {
      if (session.user) {
        session.user.id = (user?.id as string) ?? (token?.sub as string) ?? ""
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
