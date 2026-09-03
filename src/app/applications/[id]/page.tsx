import { requireUserId } from "@/lib/session"
import { getApplicationWithRelations } from "@/lib/queries"
import { db } from "@/lib/db"
import { companies, type JobApplication } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ApplicationFormDialog } from "@/components/application-form"
import { ApplicationDetailClient, type ApplicationDetail } from "./detail-client"
import { ArrowLeft, ExternalLink, Building2 } from "lucide-react"
import Link from "next/link"
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils"

export const metadata = { title: "Detail Lamaran — JobTracker" }

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const userId = await requireUserId()
  const { id } = await params
  const app = await getApplicationWithRelations(userId, id)
  if (!app) notFound()

  const userCompanies = await db.select().from(companies)
    .where(eq(companies.userId, userId))

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" asChild aria-label="Kembali">
              <Link href="/applications"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{app.positionTitle}</h1>
                <StatusBadge status={app.status} />
                <PriorityBadge priority={app.priority} />
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {app.company?.name ?? "Tanpa perusahaan"}
                {app.location && <span>· {app.location}</span>}
                {app.workMode && <span>· {app.workMode}</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {app.jobUrl && (
              <Button variant="outline" asChild>
                <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />Buka Lowongan
                </a>
              </Button>
            )}
            <ApplicationFormDialog
              companies={userCompanies}
              app={app as unknown as JobApplication}
              trigger={<Button>Edit</Button>}
            />
          </div>
        </div>

        <ApplicationDetailClient app={app as unknown as ApplicationDetail} companies={userCompanies} />
      </div>
    </DashboardLayout>
  )
}