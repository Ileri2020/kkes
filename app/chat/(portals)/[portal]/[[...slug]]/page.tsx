import { PortalPage } from "@/components/portal-shell";

function titleFromSlug(slug?: string[]) {
  if (!slug?.length) return "Dashboard";
  return slug[slug.length - 1]
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PortalRoute({
  params,
}: Readonly<{ params: Promise<{ portal: string; slug?: string[] }> }>) {
  const { portal, slug } = await params;
  return <PortalPage portal={portal} section={titleFromSlug(slug)} />;
}