import { redirect } from "next/navigation"
import { isNoAuthMode } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase } from "lucide-react"
import Link from "next/link"

const hasGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)

export default async function LoginPage() {
  // Mode lokal tanpa DATABASE_URL: tidak perlu login
  if (isNoAuthMode()) redirect("/dashboard")

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">JobTracker</CardTitle>
          <CardDescription>
            Catat, pantau, dan evaluasi seluruh proses lamaran kerja kamu di satu tempat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasGoogle ? (
            <form
              action={async () => {
                "use server"
                const { signIn } = await import("@/auth")
                await signIn("google", { redirectTo: "/dashboard" })
              }}
            >
              <Button type="submit" size="lg" className="w-full">
                Masuk dengan Google
              </Button>
            </form>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
              Login belum dikonfigurasi. Set AUTH_GOOGLE_ID dan AUTH_GOOGLE_SECRET
              di environment, atau jalankan mode lokal tanpa DATABASE_URL untuk
              memakai aplikasi tanpa login.
            </div>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Data lamaran kamu bersifat privat dan hanya dapat diakses oleh akun kamu.
          </p>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
