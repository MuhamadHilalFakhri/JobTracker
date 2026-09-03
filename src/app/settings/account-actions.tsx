"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Download, Trash2, LogOut } from "lucide-react"
import { deleteAccount } from "@/app/actions/profile"
import { signOut } from "next-auth/react"

export function AccountActions() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmText, setConfirmText] = useState("")

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAccount()
        toast.success("Akun dihapus")
        router.push("/login")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menghapus akun")
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Ekspor atau hapus data kamu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" asChild>
            <a href="/api/export/applications.csv">
              <Download className="mr-2 h-4 w-4" />Ekspor Semua Lamaran (CSV)
            </a>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Hapus akun beserta seluruh data lamaran, dokumen, dan pengaturan. Tindakan ini permanen.
            </p>
            <ConfirmDialog
              title="Hapus akun permanen?"
              description="Seluruh data kamu akan dihapus. Tindakan ini tidak dapat dibatalkan."
              confirmLabel="Hapus Akun Saya"
              trigger={
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />Hapus Akun
                </Button>
              }
              onConfirm={handleDelete}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}