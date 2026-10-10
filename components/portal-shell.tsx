"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/hooks/useAppContext";
import { PortalLinks } from "@/data/links";
import { PORTAL_AUTH_ENABLED } from "@/lib/portal-access";
import {
  BarChart3,
  BookOpen,
  ArrowUpRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type PortalRole = "student" | "parent" | "teacher" | "staff" | "bursar" | "admin";

const roleAccess: Record<PortalRole, string[]> = {
  student: ["student"],
  parent: ["parent"],
  teacher: ["teacher"],
  staff: ["staff", "admin"],
  bursar: ["bursar", "admin"],
  admin: ["admin"],
};

export const navigation: Record<PortalRole, { label: string; href: string; icon: typeof LayoutDashboard }[]> = {
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Practice", href: "/student/questions", icon: BookOpen },
    { label: "Past Questions", href: "/student/past-questions", icon: BookOpen },
    { label: "Quizzes", href: "/student/quizzes", icon: ClipboardList },
    { label: "Tests", href: "/student/tests", icon: ClipboardList },
    { label: "Subjects", href: "/student/subjects", icon: BookOpen },
    { label: "Assignments", href: "/student/assignments", icon: FileText },
    { label: "Classes", href: "/student/classes", icon: Users },
    { label: "Media", href: "/student/media", icon: FileText },
    { label: "Textbooks", href: "/student/textbooks", icon: BookOpen },
    { label: "Coding", href: "/student/coding", icon: BookOpen },
    { label: "Study Groups", href: "/student/study-groups", icon: Users },
    { label: "Rankings", href: "/student/rankings", icon: BarChart3 },
    { label: "Results", href: "/student/results", icon: ClipboardList },
    { label: "Analytics", href: "/student/analytics", icon: BarChart3 },
    { label: "Messages", href: "/student/messages", icon: MessageSquare },
    { label: "Complaints", href: "/student/complaints", icon: MessageSquare },
    { label: "Profile", href: "/student/profile", icon: Settings },
  ],
  parent: [
    { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    { label: "My Children", href: "/parent/children", icon: Users },
    { label: "Analytics", href: "/parent/analytics", icon: BarChart3 },
    { label: "Rankings", href: "/parent/rankings", icon: BarChart3 },
    { label: "Fees", href: "/parent/fees", icon: Wallet },
    { label: "Messages", href: "/parent/messages", icon: MessageSquare },
    { label: "Complaints", href: "/parent/complaints", icon: MessageSquare },
    { label: "Profile", href: "/parent/profile", icon: Settings },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "My Classes", href: "/teacher/classes", icon: Users },
    { label: "Question Bank", href: "/teacher/questions", icon: BookOpen },
    { label: "Quizzes", href: "/teacher/quizzes", icon: ClipboardList },
    { label: "Assignments", href: "/teacher/assignments", icon: FileText },
    { label: "Analytics", href: "/teacher/analytics", icon: BarChart3 },
    { label: "Subjects", href: "/teacher/subjects", icon: BookOpen },
    { label: "Topic Coverage", href: "/teacher/topic-coverage", icon: BarChart3 },
    { label: "Media", href: "/teacher/media", icon: FileText },
    { label: "Students", href: "/teacher/students", icon: Users },
    { label: "Rankings", href: "/teacher/rankings", icon: BarChart3 },
    { label: "Messages", href: "/teacher/messages", icon: MessageSquare },
    { label: "Profile", href: "/teacher/profile", icon: Settings },
  ],
  staff: [
    { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
    { label: "Students", href: "/staff/students", icon: Users },
    { label: "Classes", href: "/staff/classes", icon: BookOpen },
    { label: "Assignments", href: "/staff/assignments", icon: FileText },
    { label: "Complaints", href: "/staff/complaints", icon: MessageSquare },
    { label: "Results", href: "/staff/results", icon: ClipboardList },
    { label: "Media", href: "/staff/media", icon: FileText },
    { label: "Messages", href: "/staff/messages", icon: MessageSquare },
  ],
  bursar: [
    { label: "Dashboard", href: "/bursar", icon: LayoutDashboard },
    { label: "School Fees", href: "/bursar/fees", icon: Wallet },
    { label: "Students", href: "/bursar/students", icon: Users },
    { label: "Reports", href: "/bursar/reports", icon: BarChart3 },
    { label: "Transactions", href: "/bursar/transactions", icon: FileText },
    { label: "Parents", href: "/bursar/parents", icon: Users },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Classes", href: "/admin/classes", icon: BookOpen },
    { label: "Question Bank", href: "/admin/question-bank", icon: ClipboardList },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Announcements", href: "/admin/announcements", icon: MessageSquare },
    { label: "Subjects", href: "/admin/subjects", icon: BookOpen },
    { label: "Topics", href: "/admin/topics", icon: BookOpen },
    { label: "Tests", href: "/admin/tests", icon: ClipboardList },
    { label: "Assignments", href: "/admin/assignments", icon: FileText },
    { label: "Media", href: "/admin/media", icon: FileText },
    { label: "Rankings", href: "/admin/rankings", icon: BarChart3 },
    { label: "Alumni", href: "/admin/alumni", icon: Users },
    { label: "Complaints", href: "/admin/complaints", icon: MessageSquare },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
};

const labels: Record<PortalRole, string> = {
  student: "Student portal",
  parent: "Parent portal",
  teacher: "Teacher portal",
  staff: "Staff portal",
  bursar: "Finance portal",
  admin: "School administration",
};

function normalizeRole(role: unknown) {
  return String(role ?? "").toLowerCase();
}

export function PortalGate({ portal, children }: { portal: string; children: React.ReactNode }) {
  const { user } = useAppContext();
  const normalizedPortal = portal.toLowerCase() as PortalRole;
  const userRole = normalizeRole(user?.role);
  const allowed = roleAccess[normalizedPortal]?.includes(userRole);

  if (!roleAccess[normalizedPortal]) {
    return <AccessDenied message="This portal does not exist." />;
  }

  if (PORTAL_AUTH_ENABLED && !allowed) {
    return (
      <AccessDenied
        message={userRole ? `Your ${userRole} account cannot access the ${normalizedPortal} portal.` : "Sign in with an authorised school account to continue."}
      />
    );
  }

  return <>{children}</>;
}

function AccessDenied({ message }: { message: string }) {
  return (
    <main className="flex min-h-[calc(100vh-58px)] items-center justify-center px-6 py-16">
      <section className="w-full max-w-md border border-border bg-card p-8 text-center shadow-xl">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-accent">Access restricted</p>
        <h1 className="mb-3 text-2xl font-semibold">School account required</h1>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        <Link href="/" className="inline-flex bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground">
          Return home
        </Link>
      </section>
    </main>
  );
}

export function PortalPage({ portal, section = "Dashboard", children }: { portal: string; section?: string; children?: React.ReactNode }) {
  const { user } = useAppContext();
  const role = portal.toLowerCase() as PortalRole;
  const pathname = usePathname();
  const items = navigation[role] ?? [];
  const firstName = String(user?.name || "School member").trim().split(/\s+/)[0];
  const initials = String(user?.name || "S").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const portalNav = (mobile = false) => (
    <nav aria-label={`${labels[role]} navigation`} className="grid gap-1">
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`));
        const link = (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${active ? "bg-accent text-accent-foreground shadow-md shadow-accent/20" : "text-muted-foreground hover:translate-x-0.5 hover:bg-secondary/80 hover:text-foreground"}`}>
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${active ? "bg-white/15" : "bg-foreground/[0.035] group-hover:bg-background"}`}>
              <Icon size={16} strokeWidth={active ? 2.3 : 1.9} />
            </span>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
          </Link>
        );
        return mobile ? <SheetClose asChild key={href}>{link}</SheetClose> : link;
      })}
    </nav>
  );

  const portalSwitcher = (mobile = false) => (
    <div className="mt-5 border-t border-border/80 pt-4">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">School portals</p>
      <nav aria-label="School portals" className="grid gap-1">
        {PortalLinks.map(({ name, path }) => {
          const active = pathname === path || pathname.startsWith(`${path}/`);
          const link = (
            <Link key={path} href={path} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"}`}>
              {name}<ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
            </Link>
          );
          return mobile ? <SheetClose asChild key={path}>{link}</SheetClose> : link;
        })}
      </nav>
    </div>
  );

  const schoolBrand = (mobile = false) => (
    <Link href="/" className={`group relative ${mobile ? "mb-4" : "mb-4"} overflow-hidden rounded-xl bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-4 transition hover:from-accent/20`}>
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/40 bg-background/90 shadow-sm ring-1 ring-border/50">
          <Image src="/logo.png" alt="Kith & Kin International College logo" width={42} height={42} className="h-10 w-10 object-contain" priority />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold tracking-tight text-foreground">Kith & Kin</span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">International College</span>
          <span className="mt-1 block text-[11px] font-medium italic text-muted-foreground">Be Resourceful</span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
    </Link>
  );

  const userCard = (
    <div className="mt-auto flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground ring-2 ring-background">{initials || "S"}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{firstName}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{labels[role]}</span>
      </span>
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" aria-label="Account active" />
    </div>
  );

  return (
    <main className="min-h-[calc(100vh-58px)] bg-background">
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden flex-col rounded-2xl border border-border/80 bg-card p-3 text-card-foreground shadow-xl shadow-foreground/[0.04] lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          {schoolBrand()}

          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{labels[role]}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{section}</span>
            </span>
            <Sparkles className="h-4 w-4 shrink-0 text-accent/70" />
          </div>

          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
          {portalNav()}
          {portalSwitcher()}
          <div className="pt-5">{userCard}</div>
        </aside>
        <section className="min-w-0">
          <div className="mb-5 flex items-center justify-between border-b border-border/70 pb-4">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <button type="button" aria-label="Open portal navigation" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground shadow-sm transition hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden">
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="flex h-[100dvh] w-[min(88vw,340px)] flex-col gap-0 overflow-hidden border-r border-border/70 bg-card p-3 text-card-foreground shadow-2xl sm:max-w-sm">
                  <SheetTitle className="sr-only">{labels[role]} navigation</SheetTitle>
                  {schoolBrand(true)}
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm"><GraduationCap className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{labels[role]}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{section}</span></span>
                    <Sparkles className="h-4 w-4 shrink-0 text-accent/70" />
                  </div>
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{portalNav(true)}{portalSwitcher(true)}</div>
                  <div className="shrink-0 pt-4">{userCard}</div>
                </SheetContent>
              </Sheet>
              <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{labels[role]}</p>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{section}</h1>
              </div>
            </div>
          </div>
          {children ?? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.slice(1, 4).map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="group border border-border bg-card p-5 transition-colors hover:border-accent">
                  <Icon size={20} className="mb-8 text-accent" />
                  <h2 className="font-semibold group-hover:text-accent">{label}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Open {label.toLowerCase()} workspace</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function PortalShell({ portal, section, children }: { portal: string; section?: string; children?: React.ReactNode }) {
  return (
    <PortalGate portal={portal}>
      <PortalPage portal={portal} section={section}>{children}</PortalPage>
    </PortalGate>
  );
}