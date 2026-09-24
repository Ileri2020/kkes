import { WebsiteRoute } from "@/components/website-route";
export default async function Event({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <WebsiteRoute section={slug} />; }
