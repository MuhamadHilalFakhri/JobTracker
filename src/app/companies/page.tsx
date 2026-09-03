import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { companies, jobApplications, contacts } from "@/lib/db/schema"
import { and, eq, isNull, sql, desc } from "drizzle-orm"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CompanyFormDialog } from "@/components/company-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Building2, Globe, MapPin, Users } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Companies — JobTracker" }

export default async function CompaniesPage() {
  const userId = await requireUserId()

  const companiesList = await db.select({
    id: companies.id,
    name: companies.name,
    industry: companies.industry,
    location: companies.location,
    websiteUrl: companies.websiteUrl,
    companySize: companies.companySize,
    interestRating: companies.interestRating,
    appCount: sql<number>`(select count(*) from ${jobApplications} where ${jobApplications.companyId} = ${companies.id} and ${jobApplications.isArchived} = false)`,
    contactCount: sql<number>`(select count(*) from ${contacts} where ${contacts.companyId} = ${companies.id})`,
  })
    .from(companies)
    .where(and(eq(companies.userId, userId), isNull(companies.deletedAt)))
    .orderBy(desc(companies.createdAt))

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
            <p className="text-sm text-muted-foreground">{companiesList.length} perusahaan tersimpan</p>
          </div>
          <CompanyFormDialog trigger={<Button>+ Tambah Perusahaan</Button>} />
        </div>

        {companiesList.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-10 w-10" />}
            title="Belum ada perusahaan"
            description="Simpan informasi perusahaan yang kamu lamar untuk melacak riwayatnya."
            action={<CompanyFormDialog trigger={<Button>+ Tambah Perusahaan</Button>} />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companiesList.map((c) => (
              <Link key={c.id} href={`/companies/${c.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      {c.interestRating != null && (
                        <span className="text-sm">{"★".repeat(c.interestRating)}{"☆".repeat(5 - c.interestRating)}</span>
                      )}
                    </div>
                    <h3 className="mt-3 font-medium">{c.name}</h3>
                    {c.industry && <p className="text-xs text-muted-foreground">{c.industry}</p>}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>}
                      {c.companySize && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.companySize}</span>}
                      {c.websiteUrl && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />Website</span>}
                    </div>
                    <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                      {c.appCount} lamaran · {c.contactCount} kontak
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
