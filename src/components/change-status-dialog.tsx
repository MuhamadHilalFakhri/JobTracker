"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/form/select-wrapper"
import { changeApplicationStatus } from "@/app/actions/applications"
import { STATUSES } from "@/lib/status"

export function ChangeStatusDialog({
  applicationId, currentStatus, onSuccess,
}: {
  applicationId: string
  currentStatus: string
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const requiresReason = status === "Rejected" || status === "Withdrawn"

  const handleSubmit = () => {
    if (status === currentStatus) {
      setOpen(false)
      return
    }
    startTransition(async () => {
      try {
        await changeApplicationStatus(applicationId, status, reason.trim() || undefined)
        toast.success(`Status diubah ke ${status}`)
        setOpen(false)
        setReason("")
        onSuccess?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal mengubah status")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setStatus(currentStatus) }}>
      <DialogTrigger asChild>
        <Button className="w-full">Ubah Status</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Status Lamaran</DialogTitle>
          <DialogDescription>
            Status saat ini: <span className="font-medium">{currentStatus}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <SelectField
            label="Status Baru"
            value={status}
            onChange={setStatus}
            options={STATUSES}
            required
          />
          {requiresReason && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Alasan {status === "Rejected" ? "Penolakan" : "Penarikan"} <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={status === "Rejected" ? "e.g. Posisi sudah terisi" : "e.g. Sudah menerima tawaran lain"}
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isPending || (requiresReason && !reason.trim())}>
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}