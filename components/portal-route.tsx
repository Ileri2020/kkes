import { PortalShell } from "@/components/portal-shell";

export function PortalRoute({ portal, section }: { portal: string; section: string }) {
  return <PortalShell portal={portal} section={section} />;
}
