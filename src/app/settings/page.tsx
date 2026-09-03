import { requireUserId } from "@/lib/session"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "./settings-form"
import { AccountActions } from "./account-actions"

export const metadata = { title: "Settings — JobTracker" }

export default async function SettingsPage() {
  const userId = await requireUserId()
  const session = await auth()

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Kelola akun, tampilan, dan preferensi kamu</p>
        </div>

        <SettingsForm
          user={{
            name: user?.name ?? "",
            email: user?.email ?? "",
            image: user?.image ?? null,
            timezone: user?.timezone ?? "Asia/Jakarta",
            locale: user?.locale ?? "id",
            currency: user?.currency ?? "IDR",
            dateFormat: user?.dateFormat ?? "DD/MM/YYYY",
            theme: (user?.theme as "light" | "dark" | "system") ?? "system",
          }}
        />

        <AccountActions />
      </div>
    </DashboardLayout>
  )
}