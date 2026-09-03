import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { contacts, companies, jobApplications, applicationContacts } from "@/lib/db/schema"
import { and, eq, isNull, sql, desc, inArray } from "drizzle-orm"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ContactFormDialog } from "@/components/contact-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { Users, Mail, Phone, Link2 } from "lucide-react"
import { getUserCompanies } from "@/lib/queries"

export const metadata = { title: "Contacts — JobTracker" }

export default async function ContactsPage() {
  const userId = await requireUserId()

  const [contactList, userCompanies] = await Promise.all([
    db.select({
      id: contacts.id,
      name: contacts.name,
      jobTitle: contacts.jobTitle,
      email: contacts.email,
      phone: contacts.phone,
      linkedinUrl: contacts.linkedinUrl,
      lastContactedAt: contacts.lastContactedAt,
      companyId: contacts.companyId,
      appCount: sql<number>`(select count(*) from ${applicationContacts} where ${applicationContacts.contactId} = ${contacts.id})`,
    })
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt)),
    getUserCompanies(userId),
  ])

  const companyIds = [...new Set(contactList.map((c) => c.companyId).filter(Boolean))] as string[]
  const companyMap = companyIds.length > 0
    ? new Map((await db.select().from(companies).where(inArray(companies.id, companyIds))).map((c) => [c.id, c]))
    : new Map()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
            <p className="text-sm text-muted-foreground">{contactList.length} kontak recruiter</p>
          </div>
          <ContactFormDialog companies={userCompanies} trigger={<Button>+ Tambah Kontak</Button>} />
        </div>

        {contactList.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="Belum ada kontak"
            description="Simpan kontak recruiter/HR yang kamu hubungi selama proses rekrutmen."
            action={<ContactFormDialog companies={userCompanies} trigger={<Button>+ Tambah Kontak</Button>} />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contactList.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {c.jobTitle ?? "Recruiter"}
                        {c.companyId && companyMap.get(c.companyId) ? ` · ${companyMap.get(c.companyId)!.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {c.email && <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" />{c.email}</p>}
                    {c.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{c.phone}</p>}
                    {c.linkedinUrl && (
                      <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                        <Link2 className="h-3 w-3 shrink-0" />LinkedIn
                      </a>
                    )}
                  </div>
                  <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                    {c.appCount} lamaran terkait
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
