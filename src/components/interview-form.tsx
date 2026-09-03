"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { TextInput, Field } from "@/components/form/inputs"
import { SelectField } from "@/components/form/select-wrapper"
import { Textarea } from "@/components/ui/textarea"
import { createInterview, updateInterview, deleteInterview, completeInterview, rescheduleInterview } from "@/app/actions/interviews"
import { INTERVIEW_MODES, INTERVIEW_TYPES, INTERVIEW_STATUSES } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { Interview } from "@/lib/db/schema"

export function InterviewFormDialog({
  trigger, interview, applicationId,
}: {
  trigger: React.ReactNode
  interview?: Interview
  applicationId?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [values, setValues] = useState({
    title: interview?.title ?? "",
    type: interview?.type ?? "Interview",
    startAt: interview?.startAt
      ? new Date(interview.startAt).toISOString().slice(0, 16)
      : "",
    endAt: interview?.endAt
      ? new Date(interview.endAt).toISOString().slice(0, 16)
      : "",
    mode: interview?.mode ?? "Online",
    location: interview?.location ?? "",
    meetingUrl: interview?.meetingUrl ?? "",
    interviewerName: interview?.interviewerName ?? "",
    preparationNotes: interview?.preparationNotes ?? "",
    status: interview?.status ?? "Scheduled",
  })

  const set = (k: keyof typeof values, v: string) => setValues((p) => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!values.title.trim()) { toast.error("Judul wajib diisi"); return }
    if (!values.startAt) { toast.error("Waktu mulai wajib diisi"); return }
    setIsPending(true)
    try {
      const payload = {
        ...values,
        applicationId: applicationId ?? interview?.applicationId ?? null,
      }
      if (interview) await updateInterview(interview.id, payload)
      else await createInterview(payload)
      toast.success(interview ? "Interview diperbarui" : "Interview ditambahkan")
      setOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{interview ? "Edit" : "Tambah"} Interview</DialogTitle>
          <DialogDescription>Jadwalkan interview, technical test, atau assessment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <TextInput label="Judul" required value={values.title}
            onChange={(e) => set("title", e.target.value)} placeholder="e.g. HR Interview" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Tipe" value={values.type} onChange={(v) => set("type", v)} options={INTERVIEW_TYPES} />
            <SelectField label="Mode" value={values.mode} onChange={(v) => set("mode", v)} options={INTERVIEW_MODES} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Waktu Mulai" type="datetime-local" required value={values.startAt}
              onChange={(e) => set("startAt", e.target.value)} />
            <TextInput label="Waktu Selesai" type="datetime-local" value={values.endAt}
              onChange={(e) => set("endAt", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Lokasi / URL Meeting" value={values.meetingUrl}
              onChange={(e) => set("meetingUrl", e.target.value)} placeholder="https://zoom.us/..." />
            <TextInput label="Lokasi Fisik" value={values.location}
              onChange={(e) => set("location", e.target.value)} placeholder="e.g. Kantor Tokopedia Lt. 5" />
          </div>
          <TextInput label="Nama Interviewer" value={values.interviewerName}
            onChange={(e) => set("interviewerName", e.target.value)} placeholder="e.g. Budi (Engineering Manager)" />
          <Field label="Catatan Persiapan">
            <Textarea value={values.preparationNotes} onChange={(e) => set("preparationNotes", e.target.value)} rows={3} />
          </Field>
          {interview && (
            <SelectField label="Status" value={values.status} onChange={(v) => set("status", v)} options={INTERVIEW_STATUSES} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}