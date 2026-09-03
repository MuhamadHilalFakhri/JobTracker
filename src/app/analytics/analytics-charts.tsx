"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts"

const COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#f97316"]

export function AnalyticsCharts({
  byWorkMode, byEmployment, rejectionReasons,
}: {
  byWorkMode: { name: string; count: number }[]
  byEmployment: { name: string; count: number }[]
  rejectionReasons: { reason: string; count: number }[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Work mode distribution */}
      {byWorkMode.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sistem Kerja</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byWorkMode} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d: { name?: string; value?: number }) => `${d.name} (${d.value ?? 0})`}>
                  {byWorkMode.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Employment type */}
      {byEmployment.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Jenis Pekerjaan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byEmployment}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Rejection reasons */}
      {rejectionReasons.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Alasan Penolakan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rejectionReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="reason" type="category" tick={{ fontSize: 12 }} width={200} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}