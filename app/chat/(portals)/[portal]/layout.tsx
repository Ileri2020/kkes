import { PortalGate } from "@/components/portal-shell";

export default async function PortalLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ portal: string }> }>) {
  const { portal } = await params;
  return <PortalGate portal={portal}>{children}</PortalGate>;
}