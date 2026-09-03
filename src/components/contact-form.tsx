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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createContact, updateContact } from "@/app/actions/contacts"
import type { Company, Contact } from "@/lib/db/schema"

export function ContactFormDialog({
  trigger, companies, contact,
}: {
  trigger: React.ReactNode
  companies: Company[]
  contact?: Contact
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState({
    name: contact?.name ?? "",
    companyId: contact?.companyId ?? "",
    jobTitle: contact?.jobTitle ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    linkedinUrl: contact?.linkedinUrl ?? "",
    notes: contact?.notes ?? "",
  })

  const set = (k: keyof typeof values, v: string) => setValues((p) => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (!values.name.trim()) {
      toast.error("Nama kontak wajib diisi")
      return
    }
    startTransition(async () => {
      try {
        const payload = { ...values, companyId: values.companyId || null }
        if (contact) await updateContact(contact.id, payload)
        else await createContact(payload)
        toast.success(contact ? "Kontak diperbarui" : "Kontak ditambahkan")
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Kontak" : "Tambah Kontak"}</DialogTitle>
          <DialogDescription>Informasi recruiter atau HR yang kamu hubungi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <TextInput label="Nama" required value={values.name}
            onChange={(e) => set("name", e.target.value)} placeholder="e.g. Budi Santoso" />
          <div className="space-y-1.5">
            <Label>Perusahaan</Label>
            <Select value={values.companyId || undefined} onValueChange={(v) => set("companyId", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih perusahaan" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Jabatan" value={values.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)} placeholder="e.g. HR Manager" />
            <TextInput label="Email" type="email" value={values.email}
              onChange={(e) => set("email", e.target.value)} placeholder="nama@perusahaan.com" />
            <TextInput label="Telepon" value={values.phone}
              onChange={(e) => set("phone", e.target.value)} placeholder="08..." />
            <TextInput label="LinkedIn" value={values.linkedinUrl}
              onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <Field label="Catatan Komunikasi">
            <Textarea value={values.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
              placeholder="e.g. Responsif via WhatsApp, lebih suka dipanggil Budi" />
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