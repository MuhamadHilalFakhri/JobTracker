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
import { Textarea } from "@/components/ui/textarea"
import { createCompany, updateCompany, deleteCompany, findSimilarCompanies } from "@/app/actions/companies"
import type { Company } from "@/lib/db/schema"

export function CompanyFormDialog({
  trigger, company,
}: {
  trigger: React.ReactNode
  company?: Company
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [similar, setSimilar] = useState<{ id: string; name: string }[]>([])
  const [values, setValues] = useState({
    name: company?.name ?? "",
    industry: company?.industry ?? "",
    companySize: company?.companySize ?? "",
    websiteUrl: company?.websiteUrl ?? "",
    linkedinUrl: company?.linkedinUrl ?? "",
    location: company?.location ?? "",
    description: company?.description ?? "",
    cultureNotes: company?.cultureNotes ?? "",
    interestRating: company?.interestRating?.toString() ?? "",
  })

  const set = (k: keyof typeof values, v: string) => setValues((p) => ({ ...p, [k]: v }))

  const checkSimilar = async (name: string) => {
    set("name", name)
    if (name.trim().length >= 3 && !company) {
      try {
        const res = await findSimilarCompanies(name)
        setSimilar(res.filter((c) => c.name.toLowerCase() !== name.trim().toLowerCase()))
      } catch { /* ignore */ }
    } else {
      setSimilar([])
    }
  }

  const handleSubmit = () => {
    if (!values.name.trim()) {
      toast.error("Nama perusahaan wajib diisi")
      return
    }
    startTransition(async () => {
      try {
        const payload = {
          ...values,
          interestRating: values.interestRating ? Number(values.interestRating) : null,
        }
        if (company) await updateCompany(company.id, payload)
        else await createCompany(payload)
        toast.success(company ? "Perusahaan diperbarui" : "Perusahaan ditambahkan")
        setOpen(false)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menyimpan")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Perusahaan" : "Tambah Perusahaan"}</DialogTitle>
          <DialogDescription>Informasi perusahaan tujuan lamaran.</DialogDescription>
        </DialogHeader>

        {similar.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
            <p className="font-medium">Nama mirip sudah ada:</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {similar.map((s) => <li key={s.id}>{s.name}</li>)}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <TextInput label="Nama Perusahaan" required value={values.name}
            onChange={(e) => checkSimilar(e.target.value)} placeholder="e.g. Tokopedia" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Industri" value={values.industry}
              onChange={(e) => set("industry", e.target.value)} placeholder="e.g. Fintech" />
            <TextInput label="Ukuran" value={values.companySize}
              onChange={(e) => set("companySize", e.target.value)} placeholder="e.g. 50-200 karyawan" />
            <TextInput label="Website" value={values.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://..." />
            <TextInput label="LinkedIn" value={values.linkedinUrl}
              onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/..." />
            <TextInput label="Lokasi" value={values.location}
              onChange={(e) => set("location", e.target.value)} placeholder="e.g. Jakarta" />
            <TextInput label="Rating Ketertarikan (0-5)" type="number" min={0} max={5}
              value={values.interestRating} onChange={(e) => set("interestRating", e.target.value)} />
          </div>
          <Field label="Deskripsi">
            <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </Field>
          <Field label="Catatan Budaya Kerja">
            <Textarea value={values.cultureNotes} onChange={(e) => set("cultureNotes", e.target.value)} rows={2} />
          </Field>
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