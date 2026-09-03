import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { documents, applicationDocuments, jobApplications, companies } from "@/lib/db/schema"
import { and, eq, isNull, desc, inArray, count } from "drizzle-orm"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DocumentUploadDialog } from "@/components/document-upload-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { FileText, Download, Trash2 } from "lucide-react"
import { formatDate, formatFileSize } from "@/lib/utils"
import { deleteDocument } from "@/app/actions/documents"

export const metadata = { title: "Documents — JobTracker" }

export default async function DocumentsPage() {
  const userId = await requireUserId()

  const [docs, allApps, userCompanies] = await Promise.all([
    db.select().from(documents)
      .where(and(eq(documents.userId, userId), isNull(documents.deletedAt)))
      .orderBy(desc(documents.createdAt)),
    db.select({
      id: jobApplications.id,
      positionTitle: jobApplications.positionTitle,
      companyId: jobApplications.companyId,
      status: jobApplications.status,
    }).from(jobApplications)
      .where(and(eq(jobApplications.userId, userId), isNull(jobApplications.deletedAt), eq(jobApplications.isArchived, false)))
      .orderBy(desc(jobApplications.createdAt))
      .limit(50),
    db.select().from(companies).where(eq(companies.userId, userId)),
  ])

  const appCompanyIds = [...new Set(allApps.map((a) => a.companyId).filter(Boolean))] as string[]
  const companyMap = appCompanyIds.length > 0
    ? new Map((await db.select().from(companies).where(inArray(companies.id, appCompanyIds))).map((c) => [c.id, c]))
    : new Map()

  // Count usage per document
  const usageCounts = docs.length > 0
    ? await db.select({
      documentId: applicationDocuments.documentId,
      count: count(),
    }).from(applicationDocuments)
      .where(inArray(applicationDocuments.documentId, docs.map((d) => d.id)))
      .groupBy(applicationDocuments.documentId)
    : []

  const usageMap = new Map(usageCounts.map((u) => [u.documentId, Number(u.count)]))

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground">CV, cover letter, dan dokumen lamaran lainnya</p>
          </div>
          <DocumentUploadDialog applications={allApps} trigger={
            <Button>+ Upload Dokumen</Button>
          } />
        </div>

        {docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title="Belum ada dokumen"
            description="Upload CV dan dokumen lamaran untuk melacak versi yang kamu kirim."
            action={<DocumentUploadDialog applications={allApps} trigger={<Button>+ Upload Dokumen</Button>} />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{doc.originalFilename ?? doc.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} · v{doc.version} · {formatFileSize(doc.sizeBytes)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <span className="text-xs text-muted-foreground">
                      {usageMap.get(doc.id) ?? 0} lamaran · {formatDate(doc.createdAt)}
                    </span>
                    <div className="flex gap-1">
                      <a
                        href={`/api/blob/download/${doc.id}`}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <ConfirmDialog
                        trigger={
                          <button className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Hapus">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                        title="Hapus dokumen?"
                        description={`"${doc.originalFilename ?? doc.name}" akan dihapus permanen dari penyimpanan.`}
                        onConfirm={async () => { await deleteDocument(doc.id) }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}