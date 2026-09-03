import { requireUserId } from "@/lib/session"
import { getApplicationsForKanban } from "@/lib/queries"
import { getUserCompanies } from "@/lib/queries"
import { DashboardLayout } from "@/components/dashboard-layout"
import { KanbanBoard } from "./kanban-board"

export const metadata = { title: "Kanban — JobTracker" }

export default async function KanbanPage() {
  const userId = await requireUserId()
  const [apps, companies] = await Promise.all([
    getApplicationsForKanban(userId),
    getUserCompanies(userId),
  ])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Seret kartu antarkolom untuk mengubah status lamaran
          </p>
        </div>
        <KanbanBoard applications={apps} companies={companies} />
      </div>
    </DashboardLayout>
  )
}