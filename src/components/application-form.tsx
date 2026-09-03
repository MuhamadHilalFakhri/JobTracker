"use client"

import { useState, useTransition } from "react"
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
import { Separator } from "@/components/ui/separator"
import { createApplication, updateApplication } from "@/app/actions/applications"
import {
  WORK_MODES, EMPLOYMENT_TYPES, SENIORITY_LEVELS, PRIORITIES,
  SALARY_PERIODS, CURRENCIES,
} from "@/lib/constants"
import { STATUSES, requiresAppliedDate } from "@/lib/status"
import type { JobApplication, Company } from "@/lib/db/schema"

export type ApplicationFormValues = {
  positionTitle: string
  companyName: string
  companyId?: string
  location: string
  workMode: string
  employmentType: string
  seniorityLevel: string
  sourceName: string
  jobUrl: string
  jobDescription: string
  jobRequirements: string
  salaryMin: string
  salaryMax: string
  salaryCurrency: string
  salaryPeriod: string
  status: string
  priority: string
  foundAt: string
  appliedAt: string
  deadlineAt: string
  notes: string
}

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  if (isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export function emptyForm(companies: Company[]): ApplicationFormValues {
  return {
    positionTitle: "", companyName: "", location: "", workMode: "",
    employmentType: "", seniorityLevel: "", sourceName: "",
    jobUrl: "", jobDescription: "", jobRequirements: "",
    salaryMin: "", salaryMax: "", salaryCurrency: "IDR", salaryPeriod: "Bulanan",
    status: "Wishlist", priority: "Medium",
    foundAt: "", appliedAt: "", deadlineAt: "", notes: "",
  }
}

export function fromApplication(app: JobApplication, company?: Company | null, sourceName?: string): ApplicationFormValues {
  return {
    positionTitle: app.positionTitle,
    companyName: company?.name ?? "",
    companyId: app.companyId ?? undefined,
    location: app.location ?? "",
    workMode: app.workMode ?? "",
    employmentType: app.employmentType ?? "",
    seniorityLevel: app.seniorityLevel ?? "",
    sourceName: sourceName ?? "",
    jobUrl: app.jobUrl ?? "",
    jobDescription: app.jobDescription ?? "",
    jobRequirements: app.jobRequirements ?? "",
    salaryMin: app.salaryMin != null ? String(app.salaryMin) : "",
    salaryMax: app.salaryMax != null ? String(app.salaryMax) : "",
    salaryCurrency: app.salaryCurrency ?? "IDR",
    salaryPeriod: app.salaryPeriod ?? "Bulanan",
    status: app.status,
    priority: app.priority ?? "Medium",
    foundAt: toDateInput(app.foundAt),
    appliedAt: toDateInput(app.appliedAt),
    deadlineAt: toDateInput(app.deadlineAt),
    notes: app.notes ?? "",
  }
}

export function ApplicationFormDialog({
  trigger, companies, app, onSuccess,
}: {
  trigger: React.ReactNode
  companies: Company[]
  app?: JobApplication & { source?: { name: string } | null }
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<ApplicationFormValues>(() =>
    app ? fromApplication(app) : emptyForm(companies)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  // Kalau status pindah ke >= Applied dan appliedAt kosong, isi otomatis hari ini
  const handleStatusChange = (s: string) => {
    set("status", s)
    if (requiresAppliedDate(s) && !values.appliedAt) {
      set("appliedAt", new Date().toISOString().slice(0, 10))
    }
  }

  const handleSubmit = () => {
    const errs: Record<string, string> = {}
    if (!values.positionTitle.trim()) errs.positionTitle = "Nama posisi wajib diisi"
    if (!values.companyName.trim() && !values.companyId) errs.companyName = "Nama perusahaan wajib diisi"
    if (requiresAppliedDate(values.status) && !values.appliedAt) errs.appliedAt = "Tanggal melamar wajib diisi"
    const min = values.salaryMin ? Number(values.salaryMin) : null
    const max = values.salaryMax ? Number(values.salaryMax) : null
    if (min != null && max != null && min > max) errs.salaryMax = "Gaji maksimum tidak boleh lebih kecil dari minimum"
    if (values.jobUrl && !/^https?:\/\//.test(values.jobUrl)) errs.jobUrl = "URL tidak valid"
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload = {
      positionTitle: values.positionTitle.trim(),
      companyId: values.companyId || null,
      companyName: values.companyId ? undefined : values.companyName.trim() || undefined,
      location: values.location || undefined,
      workMode: values.workMode || null,
      employmentType: values.employmentType || null,
      seniorityLevel: values.seniorityLevel || null,
      sourceName: values.sourceName.trim() || undefined,
      jobUrl: values.jobUrl.trim() || "",
      jobDescription: values.jobDescription,
      jobRequirements: values.jobRequirements,
      salaryMin: min,
      salaryMax: max,
      salaryCurrency: values.salaryCurrency,
      salaryPeriod: values.salaryPeriod,
      status: values.status,
      priority: values.priority,
      foundAt: values.foundAt || null,
      appliedAt: values.appliedAt || null,
      deadlineAt: values.deadlineAt || null,
      notes: values.notes,
    }

    startTransition(async () => {
      try {
        if (app) {
          await updateApplication(app.id, payload)
          toast.success("Lamaran diperbarui")
        } else {
          const res = await createApplication(payload)
          toast.success("Lamaran berhasil dibuat")
          router.push(`/applications/${res.id}`)
        }
        setOpen(false)
        onSuccess?.()
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Terjadi kesalahan")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrors({}) }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{app ? "Edit Lamaran" : "Tambah Lamaran"}</DialogTitle>
          <DialogDescription>
            Lengkapi informasi lowongan pekerjaan. Field bertanda * wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pekerjaan</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Nama Posisi" required value={values.positionTitle}
                onChange={(e) => set("positionTitle", e.target.value)} error={errors.positionTitle}
                placeholder="e.g. Full-Stack Developer" />
              <TextInput label="Perusahaan" required value={values.companyName}
                onChange={(e) => { set("companyName", e.target.value); set("companyId", undefined) }}
                error={errors.companyName} list="company-list"
                placeholder="Ketik nama perusahaan" />
              <datalist id="company-list">
                {companies.map((c) => <option key={c.id} value={c.name} />)}
              </datalist>
              <TextInput label="Lokasi" value={values.location}
                onChange={(e) => set("location", e.target.value)} placeholder="e.g. Jakarta / Remote" />
              <SelectField label="Sistem Kerja" value={values.workMode || undefined}
                onChange={(v) => set("workMode", v)} options={WORK_MODES} placeholder="Pilih sistem kerja" />
              <SelectField label="Jenis Pekerjaan" value={values.employmentType || undefined}
                onChange={(v) => set("employmentType", v)} options={EMPLOYMENT_TYPES} placeholder="Pilih jenis" />
              <SelectField label="Level" value={values.seniorityLevel || undefined}
                onChange={(v) => set("seniorityLevel", v)} options={SENIORITY_LEVELS} placeholder="Pilih level" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sumber & URL</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Sumber Lowongan" value={values.sourceName}
                onChange={(e) => set("sourceName", e.target.value)} placeholder="e.g. LinkedIn, JobStreet" />
              <TextInput label="URL Lowongan" value={values.jobUrl}
                onChange={(e) => set("jobUrl", e.target.value)} error={errors.jobUrl}
                placeholder="https://..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Deskripsi Pekerjaan">
                <Textarea value={values.jobDescription} onChange={(e) => set("jobDescription", e.target.value)}
                  rows={4} placeholder="Tempel deskripsi lowongan..." />
              </Field>
              <Field label="Persyaratan">
                <Textarea value={values.jobRequirements} onChange={(e) => set("jobRequirements", e.target.value)}
                  rows={4} placeholder="Tempel persyaratan..." />
              </Field>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Gaji</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <TextInput label="Gaji Min" type="number" value={values.salaryMin}
                onChange={(e) => set("salaryMin", e.target.value)} placeholder="0" />
              <TextInput label="Gaji Max" type="number" value={values.salaryMax}
                onChange={(e) => set("salaryMax", e.target.value)} error={errors.salaryMax} placeholder="0" />
              <SelectField label="Mata Uang" value={values.salaryCurrency}
                onChange={(v) => set("salaryCurrency", v)} options={CURRENCIES} />
              <SelectField label="Periode" value={values.salaryPeriod}
                onChange={(v) => set("salaryPeriod", v)} options={SALARY_PERIODS} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status & Prioritas</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Status" value={values.status} onChange={handleStatusChange} options={STATUSES} required />
              <SelectField label="Prioritas" value={values.priority} onChange={(v) => set("priority", v)} options={PRIORITIES} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput label="Tanggal Ditemukan" type="date" value={values.foundAt}
                onChange={(e) => set("foundAt", e.target.value)} />
              <TextInput label="Tanggal Melamar" type="date" value={values.appliedAt}
                onChange={(e) => set("appliedAt", e.target.value)} error={errors.appliedAt} />
              <TextInput label="Deadline Lowongan" type="date" value={values.deadlineAt}
                onChange={(e) => set("deadlineAt", e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Catatan</h3>
            <Field label="Catatan Pribadi">
              <Textarea value={values.notes} onChange={(e) => set("notes", e.target.value)}
                rows={3} placeholder="Catatan internal tentang lamaran ini..." />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Menyimpan..." : app ? "Simpan Perubahan" : "Buat Lamaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
