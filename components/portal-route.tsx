import { PortalShell } from "@/components/portal-shell";

export function PortalRoute({ portal, section, children }: { portal: string; section: string; children?: React.ReactNode }) {
  return <PortalShell portal={portal} section={section}>{children}</PortalShell>;
}
