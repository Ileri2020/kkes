import { requireRole } from "@/lib/authorization";

export default async function AlumniLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ALUMNI");
  return children;
}
