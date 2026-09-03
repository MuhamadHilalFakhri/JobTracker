"use client"

import { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { ApplicationFormDialog } from "@/components/application-form"
import { EmptyState } from "@/components/empty-state"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  Plus, Search, X, MoreHorizontal, ExternalLink, Copy, Archive, ArchiveRestore, Trash2, Filter,
} from "lucide-react"
import { toast } from "sonner"
import { STATUSES, STATUS_GROUPS } from "@/lib/status"
import { formatDate, formatCurrency } from "@/lib/utils"
import {
  archiveApplication, deleteApplication, duplicateApplication,
} from "@/app/actions/applications"
import type { Company } from "@/lib/db/schema"

type ApplicationRow = {
  id: string
  positionTitle: string
  companyId: string | null
  location: string | null
  workMode: string | null
  employmentType: string | null
  status: string
  priority: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  salaryPeriod: string | null
  appliedAt: Date | string | null
  deadlineAt: Date | string | null
  jobUrl: string | null
  isArchived: boolean
  createdAt: Date | string
  company: { name: string } | null
}

const SORTS = [
  { value: "newest", label: "Terbaru ditambahkan" },
  { value: "oldest", label: "Terlama" },
  { value: "updated", label: "Terakhir diperbarui" },
  { value: "applied", label: "Tanggal melamar" },
]

export function ApplicationsListClient({
  rows, companies, params,
}: {
  rows: ApplicationRow[]
  companies: Company[]
  params: {
    q: string
    status: string
    sort: string
    archived: boolean
    page: number
    totalPages: number
    total: number
  }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParams = (changes: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") sp.delete(k)
      else sp.set(k, v)
    }
    sp.set("page", "1")
    startTransition(() => router.push(`${pathname}?${sp.toString()}`))
  }

  const hasFilters = params.q || params.status || params.archived

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {params.total} lamaran {params.archived ? "(diarsipkan)" : ""}
          </p>
        </div>
        <ApplicationFormDialog companies={companies} trigger={
          <Button><Plus className="mr-2 h-4 w-4" />Tambah Lamaran</Button>
        } />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari posisi, perusahaan, lokasi..."
            defaultValue={params.q}
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ q: (e.target as HTMLInputElement).value })
            }}
            onBlur={(e) => {
              if (e.target.value !== params.q) updateParams({ q: e.target.value })
            }}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"><Filter className="mr-1.5 h-4 w-4" />Status</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            <DropdownMenuItem onClick={() => updateParams({ status: null })}>
              Semua status
            </DropdownMenuItem>
            {STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => updateParams({ status: s })}>
                {s} {params.status === s && "✓"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">Urutkan: {SORTS.find((s) => s.value === params.sort)?.label}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SORTS.map((s) => (
              <DropdownMenuItem key={s.value} onClick={() => updateParams({ sort: s.value })}>
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={params.archived ? "secondary" : "ghost"}
          size="sm"
          onClick={() => updateParams({ archived: params.archived ? null : "1" })}
        >
          <Archive className="mr-1.5 h-4 w-4" />Arsip
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
            <X className="mr-1.5 h-4 w-4" />Hapus filter
          </Button>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-10 w-10" />}
          title={hasFilters ? "Tidak ada hasil filter" : "Belum ada lamaran"}
          description={hasFilters
            ? "Coba ubah kata kunci atau hapus filter."
            : "Mulai catat lamaran pertamamu untuk memantau progres rekrutmen."}
          action={!hasFilters && (
            <ApplicationFormDialog companies={companies} trigger={<Button>+ Tambah Lamaran</Button>} />
          )}
        />
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Gaji</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/applications/${row.id}`} className="font-medium hover:underline">
                          {row.positionTitle}
                        </Link>
                        <span className="text-xs text-muted-foreground">{row.company?.name ?? "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={row.status} />
                        <PriorityBadge priority={row.priority} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.location ?? "-"}
                      {row.workMode && <span className="block text-xs">{row.workMode}</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.salaryMin != null || row.salaryMax != null
                        ? `${formatCurrency(row.salaryMin, row.salaryCurrency ?? "IDR")} - ${formatCurrency(row.salaryMax, row.salaryCurrency ?? "IDR")}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="block">Melamar: {formatDate(row.appliedAt)}</span>
                      {row.deadlineAt && <span className="block">Deadline: {formatDate(row.deadlineAt)}</span>}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Aksi">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/applications/${row.id}`}><ExternalLink className="mr-2 h-4 w-4" />Detail</Link>
                          </DropdownMenuItem>
                          {row.jobUrl && (
                            <DropdownMenuItem asChild>
                              <a href={row.jobUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Buka Lowongan</a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={async () => {
                            await duplicateApplication(row.id)
                            toast.success("Lamaran diduplikasi")
                            router.refresh()
                          }}>
                            <Copy className="mr-2 h-4 w-4" />Duplikat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            await archiveApplication(row.id, !row.isArchived)
                            router.refresh()
                          }}>
                            {row.isArchived
                              ? <><ArchiveRestore className="mr-2 h-4 w-4" />Pulihkan</>
                              : <><Archive className="mr-2 h-4 w-4" />Arsipkan</>}
                          </DropdownMenuItem>
                          <ConfirmDialog
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Hapus
                              </DropdownMenuItem>
                            }
                            title="Hapus lamaran?"
                            description={`"${row.positionTitle}" akan dihapus permanen beserta seluruh riwayatnya. Tindakan ini tidak bisa dibatalkan.`}
                            onConfirm={async () => {
                              await deleteApplication(row.id)
                              toast.success("Lamaran dihapus")
                            }}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {params.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-2 text-sm">
              <span className="text-muted-foreground">
                Halaman {params.page} dari {params.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={params.page <= 1}
                  onClick={() => updateParams({ page: String(params.page - 1) })}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={params.page >= params.totalPages}
                  onClick={() => updateParams({ page: String(params.page + 1) })}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {isPending && <div className="text-xs text-muted-foreground">Memuat...</div>}
    </div>
  )
}