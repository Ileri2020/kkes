import { requireRole } from "@/lib/authorization";

export default async function BursarLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["BURSAR", "ADMIN"]);
  return children;
}
