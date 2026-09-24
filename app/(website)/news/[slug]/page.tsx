import { WebsiteRoute } from "@/components/website-route";
export default async function NewsStory({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <WebsiteRoute section={slug} />; }
