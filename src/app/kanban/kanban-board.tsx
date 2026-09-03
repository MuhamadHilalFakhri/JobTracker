"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext, closestCorners, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragOverlay,
  type DragEndEvent, type DragStartEvent, type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { toast } from "sonner"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { ApplicationFormDialog } from "@/components/application-form"
import { changeApplicationStatus } from "@/app/actions/applications"
import { STATUSES, STATUS_GROUPS } from "@/lib/status"
import { formatDate } from "@/lib/utils"
import { Plus, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Company } from "@/lib/db/schema"

type KanbanApp = {
  id: string
  positionTitle: string
  status: string
  priority: string | null
  appliedAt: Date | string | null
  deadlineAt: Date | string | null
  company: { id: string; name: string } | null
}

const STATUS_COLUMNS = [
  ...STATUS_GROUPS.notSent,
  ...STATUS_GROUPS.active,
  ...STATUS_GROUPS.finished,
]

function KanbanCard({ app, onOpen }: { app: KanbanApp; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group rounded-lg border bg-card p-3 shadow-sm hover:shadow-md ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-1">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none rounded text-muted-foreground hover:text-foreground"
          aria-label="Seret untuk pindah"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => onOpen(app.id)} className="text-left">
            <p className="truncate text-sm font-medium hover:underline">{app.positionTitle}</p>
            <p className="truncate text-xs text-muted-foreground">{app.company?.name ?? "Tanpa perusahaan"}</p>
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
        <PriorityBadge priority={app.priority} />
        {app.appliedAt && <span className="text-[10px] text-muted-foreground">Dikirim {formatDate(app.appliedAt)}</span>}
        {app.deadlineAt && <span className="text-[10px] text-muted-foreground">Deadline {formatDate(app.deadlineAt)}</span>}
      </div>
    </div>
  )
}

function KanbanColumn({
  status, apps, onOpen,
}: {
  status: string
  apps: KanbanApp[]
  onOpen: (id: string) => void
}) {
  const { setNodeRef } = useSortable({ id: status })
  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-lg bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-muted-foreground">{apps.length}</span>
        </div>
      </div>
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext items={apps.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {apps.map((app) => <KanbanCard key={app.id} app={app} onOpen={onOpen} />)}
        </SortableContext>
        {apps.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Tidak ada lamaran
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({
  applications, companies,
}: {
  applications: KanbanApp[]
  companies: Company[]
}) {
  const router = useRouter()
  const [items, setItems] = useState<Record<string, KanbanApp[]>>(() => {
    const map: Record<string, KanbanApp[]> = {}
    for (const s of STATUS_COLUMNS) map[s] = []
    for (const app of applications) {
      if (!map[app.status]) map[app.status] = []
      map[app.status].push(app)
    }
    return map
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {})
  )

  const allApps = useMemo(() => {
    const map = new Map<string, KanbanApp>()
    for (const list of Object.values(items)) for (const app of list) map.set(app.id, app)
    return map
  }, [items])

  const findColumn = (id: string): string | undefined => {
    for (const [status, list] of Object.entries(items)) {
      if (list.some((a) => a.id === id)) return status
    }
    if (STATUS_COLUMNS.includes(id as (typeof STATUS_COLUMNS)[number])) return id
    return undefined
  }

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return
    const activeColumn = findColumn(String(active.id))
    const overColumn = findColumn(String(over.id))
    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    setItems((prev) => {
      const activeItems = prev[activeColumn].filter((a) => a.id !== active.id)
      const overItems = [...prev[overColumn]]
      const movingApp = prev[activeColumn].find((a) => a.id === active.id)
      if (!movingApp) return prev
      const overIndex = overItems.findIndex((a) => a.id === over.id)
      const updatedApp = { ...movingApp, status: overColumn }
      if (overIndex >= 0) overItems.splice(overIndex, 0, updatedApp)
      else overItems.push(updatedApp)
      return { ...prev, [activeColumn]: activeItems, [overColumn]: overItems }
    })
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const activeColumn = findColumn(String(active.id))
    const overColumn = findColumn(String(over.id))
    if (!activeColumn || !overColumn) return

    const app = allApps.get(active.id as string)
    if (!app) return

    // Reorder dalam kolom yang sama — simpan urutan lokal
    if (activeColumn === overColumn) {
      setItems((prev) => {
        const list = [...prev[activeColumn]]
        const from = list.findIndex((a) => a.id === active.id)
        const to = list.findIndex((a) => a.id === over.id)
        if (from < 0 || to < 0) return prev
        const [moved] = list.splice(from, 1)
        list.splice(to, 0, moved)
        return { ...prev, [activeColumn]: list }
      })
      return
    }

    // Status berubah — simpan ke DB, rollback kalau gagal
    const prevStatus = app.status
    const targetStatus = overColumn

    // Terminal status butuh alasan
    if ((targetStatus === "Rejected" || targetStatus === "Withdrawn")) {
      // Minta alasan via dialog
      const reason = window.prompt(
        targetStatus === "Rejected"
          ? "Alasan penolakan (wajib):"
          : "Alasan penarikan (wajib):"
      )
      if (!reason?.trim()) {
        toast.error("Alasan wajib diisi")
        setItems((prev) => rollbackStatus(prev, active.id as string, prevStatus))
        return
      }
      await persistStatusChange(active.id as string, targetStatus, prevStatus, reason)
      return
    }

    await persistStatusChange(active.id as string, targetStatus, prevStatus)
  }

  const rollbackStatus = (
    prev: Record<string, KanbanApp[]>,
    appId: string,
    status: string
  ): Record<string, KanbanApp[]> => {
    const next: Record<string, KanbanApp[]> = {}
    for (const s of STATUS_COLUMNS) {
      next[s] = prev[s] ? [...prev[s]] : []
    }
    const moving = Object.values(next).flat().find((a) => a.id === appId)
    if (moving) {
      for (const s of STATUS_COLUMNS) next[s] = next[s].filter((a) => a.id !== appId)
      next[status] = [moving, ...next[status]]
    }
    return next
  }

  const persistStatusChange = async (
    appId: string, targetStatus: string, prevStatus: string, reason?: string
  ) => {
    startTransition(async () => {
      try {
        await changeApplicationStatus(appId, targetStatus, reason)
        toast.success(`Status diubah ke ${targetStatus}`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan perubahan")
        setItems((prev) => rollbackStatus(prev, appId, prevStatus))
      }
    })
  }

  const openApplication = (id: string) => {
    router.push(`/applications/${id}`)
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((status) => (
            <KanbanColumn key={status} status={status} apps={items[status] ?? []} onOpen={openApplication} />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="rounded-lg border bg-card p-3 shadow-lg opacity-90">
              <p className="text-sm font-medium">{allApps.get(activeId)?.positionTitle}</p>
              <p className="text-xs text-muted-foreground">{allApps.get(activeId)?.company?.name}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {isPending && <p className="text-xs text-muted-foreground">Menyimpan perubahan...</p>}
      <div className="flex justify-center">
        <ApplicationFormDialog companies={companies} trigger={
          <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" />Tambah Lamaran</Button>
        } />
      </div>
    </div>
  )
}