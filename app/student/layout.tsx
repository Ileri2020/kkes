import { requireRole } from "@/lib/authorization";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("STUDENT");
  return children;
}
