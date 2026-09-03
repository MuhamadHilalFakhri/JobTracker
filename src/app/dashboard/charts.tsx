"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { STATUS_COLORS } from "@/lib/status"
import { useMemo } from "react"

const PIE_COLORS = [
  "#3b82f6", "#06b6d4", "#10b981", "#8b5cf6", "#f59e0b",
  "#ef4444", "#f97316", "#6366f1", "#14b8a6", "#22c55e",
  "#e11d48", "#a855f7", "#78716c",
]

export function DashboardCharts({
  statusDist,
  weekly,
}: {
  statusDist: { status: string; count: number }[]
  weekly: { week: string; count: number }[]
}) {
  const pieData = useMemo(() =>
    statusDist.filter((d) => d.count > 0).map((d) => ({
      name: d.status,
      value: d.count,
    })),
    [statusDist]
  )

  const total = statusDist.reduce((a, b) => a + b.count, 0)
  const applied = statusDist.find((s) => s.status === "Applied")?.count ?? 0
  const screening = statusDist.find((s) => s.status === "Screening")?.count ?? 0
  const interviews = statusDist
    .filter((s) => ["HR Interview", "User Interview", "Final Interview"].includes(s.status))
    .reduce((a, b) => a + b.count, 0)
  const offering = statusDist.find((s) => s.status === "Offering")?.count ?? 0
  const accepted = statusDist.find((s) => s.status === "Accepted")?.count ?? 0

  const funnelData = [
    { stage: "Applied", count: applied },
    { stage: "Screening", count: screening },
    { stage: "Interview", count: interviews },
    { stage: "Offering", count: offering },
    { stage: "Accepted", count: accepted },
  ]

  const renderRate = (stage: number, base: number) => {
    if (base === 0) return "0%"
    return `${((stage / base) * 100).toFixed(0)}%`
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Pie chart — status distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribusi Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={(d: { name?: string; percent?: number }) => `${d.name} ${((d.percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Funnel — conversion rates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Funnel Rekrutmen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const pct = i === 0
                ? "100%"
                : renderRate(stage.count, funnelData[0].count)
              const width = i === 0 ? "100%" : `${(stage.count / Math.max(funnelData[0].count, 1)) * 100}%`
              return (
                <div key={stage.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">{stage.count} ({pct})</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly bar chart */}
      {weekly.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lamaran Per Minggu</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}