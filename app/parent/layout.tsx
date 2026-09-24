import { requireRole } from "@/lib/authorization";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("PARENT");
  return children;
}
