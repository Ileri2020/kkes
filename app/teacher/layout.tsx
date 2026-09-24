import { requireRole } from "@/lib/authorization";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRole("TEACHER");
  return children;
}
