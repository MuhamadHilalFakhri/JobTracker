import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { NavLinks } from "@/components/nav-items"
import { UserMenu } from "@/components/user-menu"
import { NotificationBell } from "@/components/notification-bell"
import { Menu, Briefcase } from "lucide-react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Briefcase className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">JobTracker</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile drawer — trigger di header, content di sini */}
      <Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Buka menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <div className="flex-1" />
            <NotificationBell />
            <ThemeToggle />
            <UserMenu />
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>

        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold">JobTracker</span>
          </div>
          <div className="p-3">
            <NavLinks />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
