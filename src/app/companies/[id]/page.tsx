import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { companies, jobApplications, contacts } from "@/lib/db/schema"
import { and, eq, isNull, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { CompanyFormDialog } from "@/components/company-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Globe, MapPin, Link2, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export const metadata = { title: "Detail Perusahaan — JobTracker" }

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const userId = await requireUserId()
  const { id } = await params

  const [company] = await db.select().from(companies)
    .where(and(eq(companies.id, id), eq(companies.userId, userId), isNull(companies.deletedAt)))
    .limit(1)
  if (!company) notFound()

  const [companyApps, companyContacts] = await Promise.all([
    db.select().from(jobApplications)
      .where(and(eq(jobApplications.companyId, id), eq(jobApplications.userId, userId), isNull(jobApplications.deletedAt)))
      .orderBy(desc(jobApplications.createdAt)),
    db.select().from(contacts)
      .where(and(eq(contacts.companyId, id), eq(contacts.userId, userId))),
  ])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" asChild aria-label="Kembali">
              <Link href="/companies"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {company.industry && <span>{company.industry}</span>}
                {company.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{company.location}</span>}
                {company.companySize && <span>{company.companySize}</span>}
                {company.interestRating != null && <span>Rating {company.interestRating}/5</span>}
              </div>
            </div>
          </div>
          <CompanyFormDialog company={company} trigger={<Button variant="outline">Edit</Button>} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tentang</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {company.description && <p className="whitespace-pre-wrap">{company.description}</p>}
                {company.cultureNotes && (
                  <div>
                    <p className="font-medium text-xs uppercase text-muted-foreground mb-1">Catatan Budaya Kerja</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{company.cultureNotes}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {company.websiteUrl && (
                    <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                      <Globe className="h-3.5 w-3.5" />Website
                    </a>
                  )}
                  {company.linkedinUrl && (
                    <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                      <Link2 className="h-3.5 w-3.5" />LinkedIn
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lamaran ({companyApps.length})</CardTitle></CardHeader>
              <CardContent>
                {companyApps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada lamaran ke perusahaan ini</p>
                ) : (
                  <div className="space-y-2">
                    {companyApps.map((app) => (
                      <Link key={app.id} href={`/applications/${app.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{app.positionTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {app.status} · Melamar {formatDate(app.appliedAt)}
                          </p>
                        </div>
                        <StatusBadge status={app.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Kontak ({companyContacts.length})</CardTitle></CardHeader>
            <CardContent>
              {companyContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada kontak</p>
              ) : (
                <div className="space-y-3">
                  {companyContacts.map((c) => (
                    <div key={c.id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.jobTitle}</p>
                      <div className="mt-1 space-y-0.5 text-xs">
                        {c.email && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</p>}
                        {c.phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
