"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { ChangeStatusDialog } from "@/components/change-status-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { createNote, deleteNote } from "@/app/actions/notes"
import { createTask, updateTaskStatus } from "@/app/actions/tasks"
import { archiveApplication, deleteApplication } from "@/app/actions/applications"
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils"
import {
  Plus, Trash2, CheckCircle2, Circle, Clock, Archive, AlertCircle,
} from "lucide-react"
import type { Company } from "@/lib/db/schema"


export type ApplicationDetail = {
  id: string
  positionTitle: string
  company: { id: string; name: string; logoUrl: string | null; industry: string | null; websiteUrl: string | null } | null
  source: { id: string; name: string } | null
  location: string | null
  workMode: string | null
  employmentType: string | null
  seniorityLevel: string | null
  status: string
  priority: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  salaryPeriod: string | null
  jobUrl: string | null
  jobDescription: string | null
  jobRequirements: string | null
  appliedAt: Date | string | null
  foundAt: Date | string | null
  deadlineAt: Date | string | null
  rejectionReason: string | null
  withdrawalReason: string | null
  isArchived: boolean
  interviews: {
    id: string; title: string; type: string | null; startAt: Date | string
    endAt: Date | string | null; mode: string | null; meetingUrl: string | null
    interviewerName: string | null; status: string | null
  }[]
  tasks: {
    id: string; title: string; description: string | null; type: string | null
    priority: string | null; status: string; dueAt: Date | string | null; completedAt: Date | string | null
  }[]
  contacts: { contact: { id: string; name: string; email: string | null; phone: string | null; linkedinUrl: string | null }; role: string | null }[]
  documents: { document: { id: string; name: string; type: string | null; originalFilename: string | null }; usageType: string | null }[]
  notes: { id: string; title: string | null; content: string; createdAt: Date | string; updatedAt: Date | string }[]
  history: { id: string; fromStatus: string | null; toStatus: string; note: string | null; changedAt: Date | string }[]
  timeline: { id: string; eventType: string; metadata: unknown; createdAt: Date | string }[]
}

const meta = (m: unknown): Record<string, string> =>
  (m ?? {}) as Record<string, string>

export function ApplicationDetailClient({
  app, companies,
}: {
  app: ApplicationDetail
  companies: Company[]
}) {
  const router = useRouter()
  const [newNote, setNewNote] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Info cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Detail Pekerjaan</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tipe</span><span>{app.employmentType ?? "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span>{app.seniorityLevel ?? "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sumber</span><span>{app.source?.name ?? "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ditemukan</span><span>{formatDate(app.foundAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Melamar</span><span>{formatDate(app.appliedAt)}</span></div>
              {app.deadlineAt && <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span>{formatDate(app.deadlineAt)}</span></div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gaji</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-lg font-semibold">
                {app.salaryMin != null || app.salaryMax != null
                  ? `${formatCurrency(app.salaryMin, app.salaryCurrency ?? "IDR")} — ${formatCurrency(app.salaryMax, app.salaryCurrency ?? "IDR")}`
                  : "Tidak disebutkan"}
              </div>
              {app.salaryPeriod && <div className="text-muted-foreground">Periode: {app.salaryPeriod}</div>}
            </CardContent>
          </Card>
        </div>

        {/* Job Description */}
        {app.jobDescription && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Deskripsi Pekerjaan</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{app.jobDescription}</p></CardContent>
          </Card>
        )}
        {app.jobRequirements && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Persyaratan</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{app.jobRequirements}</p></CardContent>
          </Card>
        )}

        {/* Interviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interview & Assessment</CardTitle>
            <Button variant="outline" size="sm" onClick={() => toast.info("Fitur tambah interview akan segera hadir")}>
              <Plus className="mr-1 h-3 w-3" />Tambah
            </Button>
          </CardHeader>
          <CardContent>
            {app.interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada jadwal interview</p>
            ) : (
              <div className="space-y-3">
                {app.interviews.map((iv) => (
                  <div key={iv.id} className="flex items-start justify-between rounded-lg border p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{iv.title}</span>
                        <Badge variant="outline" className="text-xs">{iv.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(iv.startAt)} {iv.mode && `· ${iv.mode}`}
                      </p>
                      {iv.meetingUrl && (
                        <a href={iv.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          Buka meeting
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Task & Follow-up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {app.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada task</p>
              ) : (
                app.tasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-2 rounded-lg border p-2">
                    <button
                      onClick={async () => {
                        await updateTaskStatus(t.id, t.status === "Completed" ? "To Do" : "Completed")
                        router.refresh()
                      }}
                      className="mt-0.5 shrink-0"
                    >
                      {t.status === "Completed"
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <div className="flex-1">
                      <span className={`text-sm ${t.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                        {t.title}
                      </span>
                      {t.dueAt && <span className="ml-2 text-xs text-muted-foreground">{formatDateTime(t.dueAt)}</span>}
                    </div>
                    <PriorityBadge priority={t.priority} />
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tambah task baru..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && newTaskTitle.trim()) {
                    await createTask({ title: newTaskTitle.trim(), applicationId: app.id })
                    setNewTaskTitle("")
                    toast.success("Task ditambahkan")
                    router.refresh()
                  }
                }}
              />
              <Button variant="outline" size="sm"
                onClick={async () => {
                  if (newTaskTitle.trim()) {
                    await createTask({ title: newTaskTitle.trim(), applicationId: app.id })
                    setNewTaskTitle("")
                    toast.success("Task ditambahkan")
                    router.refresh()
                  }
                }}
              ><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {app.notes.length === 0
                ? <p className="text-sm text-muted-foreground">Belum ada catatan</p>
                : app.notes.map((n) => (
                  <div key={n.id} className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-medium">{n.title ?? "Catatan"}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <form action={async () => { await deleteNote(n.id); router.refresh() }}>
                        <button type="submit" className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{n.content}</p>
                  </div>
                ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Tulis catatan..."
                className="min-h-[60px] text-sm"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button
                variant="outline" size="sm" className="shrink-0 self-end"
                onClick={async () => {
                  if (newNote.trim()) {
                    await createNote({ content: newNote.trim(), title: "Catatan", applicationId: app.id })
                    setNewNote("")
                    toast.success("Catatan disimpan")
                    router.refresh()
                  }
                }}
              >Simpan</Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {app.timeline.concat(
                app.history.map((h) => ({
                  id: h.id,
                  eventType: "status_change",
                  metadata: { from: h.fromStatus, to: h.toStatus, note: h.note },
                  createdAt: h.changedAt,
                }))
              ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 20).map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5">
                    {entry.eventType === "application_created" && <AlertCircle className="h-4 w-4 text-blue-500" />}
                    {entry.eventType === "status_change" && <Clock className="h-4 w-4 text-amber-500" />}
                    {entry.eventType === "task_completed" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {entry.eventType === "note_added" && <Plus className="h-4 w-4 text-violet-500" />}
                    {entry.eventType === "interview_created" && <Clock className="h-4 w-4 text-cyan-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground">
                      {entry.eventType === "application_created" && "Lamaran dibuat"}
                      {entry.eventType === "status_change" && (
                        <>Status berubah: <span className="font-medium text-foreground">{meta(entry.metadata).from ?? "—"} → {meta(entry.metadata).to ?? "—"}</span></>
                      )}
                      {entry.eventType === "task_completed" && <>Task selesai: <span className="font-medium">{meta(entry.metadata).title ?? ""}</span></>}
                      {entry.eventType === "note_added" && <>Catatan ditambahkan</>}
                      {entry.eventType === "interview_created" && <>Interview dijadwalkan: <span className="font-medium">{meta(entry.metadata).title ?? ""}</span></>}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <ChangeStatusDialog
          currentStatus={app.status}
          applicationId={app.id}
          onSuccess={() => router.refresh()}
        />

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Aksi</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm" asChild>
              <Link href={`/applications?company=${app.company?.id ?? ""}`}>Lihat semua lamaran ke {app.company?.name}</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm"
              onClick={async () => {
                await archiveApplication(app.id, !app.isArchived)
                toast.success(app.isArchived ? "Dipulihkan" : "Diarsipkan")
                router.refresh()
              }}
            >
              <Archive className="mr-2 h-4 w-4" />{app.isArchived ? "Pulihkan" : "Arsipkan"}
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="w-full justify-start text-destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />Hapus Lamaran
                </Button>
              }
              title="Hapus lamaran permanen?"
              description={`"${app.positionTitle}" akan dihapus beserta seluruh data terkait. Tindakan ini tidak bisa dibatalkan.`}
              onConfirm={async () => {
                await deleteApplication(app.id)
                router.push("/applications")
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}