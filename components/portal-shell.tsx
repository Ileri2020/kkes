"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/hooks/useAppContext";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

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

  if (!allowed) {
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

export function PortalPage({ portal, section = "Dashboard" }: { portal: string; section?: string }) {
  const { user } = useAppContext();
  const role = portal.toLowerCase() as PortalRole;
  const pathname = usePathname();
  const items = navigation[role] ?? [];
  const current = section === "Dashboard" ? labels[role] : section;

  return (
    <main className="min-h-[calc(100vh-58px)] bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[230px_1fr] lg:px-8">
        <aside className="border border-border bg-card p-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-6 border-b border-border pb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Kith & Kin</p>
            <p className="mt-2 text-lg font-semibold">{labels[role]}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{user?.name || "School member"}</p>
          </div>
          <nav className="grid gap-1">
            {items.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`));
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0">
          <div className="mb-8 border-b border-border pb-6">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">{labels[role]}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{current}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your school workspace is ready. This page shell is prepared for the next feature slice.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.slice(1, 4).map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="group border border-border bg-card p-5 transition-colors hover:border-accent">
                <Icon size={20} className="mb-8 text-accent" />
                <h2 className="font-semibold group-hover:text-accent">{label}</h2>
                <p className="mt-2 text-sm text-muted-foreground">Open {label.toLowerCase()} workspace</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function PortalShell({ portal, section }: { portal: string; section?: string }) {
  return (
    <PortalGate portal={portal}>
      <PortalPage portal={portal} section={section} />
    </PortalGate>
  );
}