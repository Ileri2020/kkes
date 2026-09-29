import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PORTAL_AUTH_ENABLED } from "@/lib/portal-access";

export const PERMISSIONS = {
  STUDENT: ["student:read", "practice:use", "messages:use", "complaints:create"],
  PARENT: ["children:read", "analytics:read", "fees:read", "messages:use", "complaints:create"],
  TEACHER: ["classes:manage", "students:read", "questions:manage", "tests:manage", "assignments:manage", "analytics:read"],
  STAFF: ["students:read", "classes:read", "assignments:read", "results:read", "media:manage", "complaints:manage"],
  BURSAR: ["fees:manage", "students:read", "parents:read", "reports:read", "transactions:manage"],
  ADMIN: ["school:manage", "users:manage", "classes:manage", "subjects:manage", "questions:manage", "fees:manage", "audit:read"],
  ALUMNI: ["alumni:read", "messages:use", "profile:manage"],
} as const;

export type Role = keyof typeof PERMISSIONS;

export function normalizeRole(role: unknown): Role | null {
  const normalized = String(role ?? "").toUpperCase() as Role;
  return normalized in PERMISSIONS ? normalized : null;
}

export function hasPermission(role: unknown, permission: string) {
  const normalized = normalizeRole(role);
  return normalized ? PERMISSIONS[normalized].includes(permission as never) : false;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/unauthorized");
  return session;
}

export async function requireRole(allowedRoles: Role | Role[]) {
  if (!PORTAL_AUTH_ENABLED) return auth();

  const session = await requireAuth();
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const role = normalizeRole(session.user.role);
  if (!role || !allowed.includes(role)) redirect("/forbidden");
  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireAuth();
  if (!hasPermission(session.user.role, permission)) redirect("/forbidden");
  return session;
}
