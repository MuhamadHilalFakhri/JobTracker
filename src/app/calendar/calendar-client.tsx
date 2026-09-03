"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns"
import { id } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { InterviewFormDialog } from "@/components/interview-form"
import type { Interview, Task, JobApplication } from "@/lib/db/schema"

type ViewMode = "month" | "agenda"

export function CalendarClient({
  interviews, tasks, deadlineApps,
}: {
  interviews: Interview[]
  tasks: Task[]
  deadlineApps: JobApplication[]
}) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>("month")

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = useMemo(() => {
    const d = []
    let day = calendarStart
    while (day <= calendarEnd) {
      d.push(day)
      day = addDays(day, 1)
    }
    return d
  }, [currentDate])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { type: string; title: string; id: string; time?: string; status?: string }[]>()

    for (const iv of interviews) {
      const d = format(new Date(iv.startAt), "yyyy-MM-dd")
      const arr = map.get(d) ?? []
      arr.push({
        type: "interview",
        title: iv.title,
        id: iv.id,
        status: iv.status ?? undefined,
        time: format(new Date(iv.startAt), "HH:mm"),
      })
      map.set(d, arr)
    }

    for (const t of tasks) {
      if (t.dueAt) {
        const d = format(new Date(t.dueAt), "yyyy-MM-dd")
        const arr = map.get(d) ?? []
        arr.push({
          type: "task",
          title: t.title,
          id: t.id,
          status: t.status ?? undefined,
          time: format(new Date(t.dueAt), "HH:mm"),
        })
        map.set(d, arr)
      }
    }

    for (const app of deadlineApps) {
      if (app.deadlineAt) {
        const d = format(new Date(app.deadlineAt), "yyyy-MM-dd")
        const arr = map.get(d) ?? []
        arr.push({
          type: "deadline",
          title: `Deadline: ${app.positionTitle}`,
          id: app.id,
        })
        map.set(d, arr)
      }
    }

    return map
  }, [interviews, tasks, deadlineApps])

  const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToday = () => setCurrentDate(new Date())

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Hari Ini</Button>
          <div className="flex">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <h2 className="text-lg font-semibold capitalize">
            {format(currentDate, "MMMM yyyy", { locale: id })}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>Bulan</Button>
          <Button variant={view === "agenda" ? "default" : "outline"} size="sm" onClick={() => setView("agenda")}>Agenda</Button>
        </div>
      </div>

      {view === "month" ? (
        <div className="rounded-lg border">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {weekdays.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          {/* Day grid */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const events = eventsByDate.get(dateKey) ?? []
              const inMonth = isSameMonth(day, currentDate)
              const today = isToday(day)

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[100px] border-b border-r p-1 transition-colors",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                    today && "bg-accent/30"
                  )}
                >
                  <div className={cn(
                    "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    today && "bg-primary text-primary-foreground font-semibold"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map((evt, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer",
                          evt.type === "interview" && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                          evt.type === "task" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                          evt.type === "deadline" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                        )}
                        onClick={() => {
                          if (evt.type === "interview") router.push(`/applications?q=${encodeURIComponent(evt.title)}`)
                        }}
                      >
                        {evt.time && <span className="font-medium">{evt.time} </span>}
                        {evt.title}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-muted-foreground pl-1">+{events.length - 3} lainnya</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Agenda view */
        <div className="space-y-4 rounded-lg border p-4">
          {Array.from(eventsByDate.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, events]) => (
              <div key={dateKey}>
                <h3 className={cn(
                  "mb-2 text-sm font-semibold",
                  isSameDay(new Date(dateKey), new Date()) && "text-primary"
                )}>
                  {format(new Date(dateKey), "EEEE, d MMMM yyyy", { locale: id })}
                  {isSameDay(new Date(dateKey), new Date()) && " (Hari Ini)"}
                </h3>
                <div className="space-y-1">
                  {events.map((evt, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        evt.type === "interview" && "border-blue-500 text-blue-700",
                        evt.type === "task" && "border-amber-500 text-amber-700",
                        evt.type === "deadline" && "border-red-500 text-red-700",
                      )}>
                        {evt.type === "interview" ? "Interview" : evt.type === "task" ? "Task" : "Deadline"}
                      </Badge>
                      <span className="flex-1">{evt.title}</span>
                      {evt.time && <span className="text-xs text-muted-foreground">{evt.time}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          {eventsByDate.size === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Tidak ada agenda untuk bulan ini</p>
          )}
        </div>
      )}
    </div>
  )
}