"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { uploadDocument } from "@/app/actions/documents"
import { DOCUMENT_TYPES } from "@/lib/constants"
import { FileText, Upload, X } from "lucide-react"

export function DocumentUploadDialog({
  applications, trigger,
}: {
  applications: { id: string; positionTitle: string; companyId: string | null; status: string }[]
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState("CV")
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10 MB")
      return
    }
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png", "image/jpeg"]
    if (!allowed.includes(f.type)) {
      toast.error("Tipe file tidak diizinkan. Gunakan PDF, DOC, DOCX, PNG, JPG")
      return
    }
    setFile(f)
  }

  const toggleApp = (id: string) => {
    setSelectedApps((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleUpload = () => {
    if (!file) { toast.error("Pilih file terlebih dahulu"); return }
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", type)
    for (const id of selectedApps) fd.append("applicationIds", id)

    startTransition(async () => {
      try {
        await uploadDocument(fd)
        toast.success("Dokumen berhasil diunggah")
        setOpen(false)
        setFile(null)
        setSelectedApps([])
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload gagal")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Dokumen</DialogTitle>
          <DialogDescription>
            PDF, DOC, DOCX, PNG, JPG — maksimal 10 MB. Dokumen disimpan privat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Dropzone */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-accent/50"
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <X className="h-4 w-4 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setFile(null) }} />
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Klik untuk pilih file</p>
                <p className="text-xs text-muted-foreground mt-1">atau seret file ke sini</p>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Jenis Dokumen</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Link to applications */}
          {applications.length > 0 && (
            <div className="space-y-1.5">
              <Label>Hubungkan ke Lamaran (opsional)</Label>
              <ScrollArea className="h-32 rounded-md border">
                <div className="space-y-1 p-2">
                  {applications.map((app) => (
                    <label key={app.id} className="flex items-center gap-2 rounded p-1.5 text-sm hover:bg-accent cursor-pointer">
                      <Checkbox
                        checked={selectedApps.includes(app.id)}
                        onCheckedChange={() => toggleApp(app.id)}
                      />
                      <span className="truncate">{app.positionTitle}</span>
                      <span className="text-xs text-muted-foreground">{app.status}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleUpload} disabled={isPending || !file}>
            {isPending ? "Mengunggah..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
