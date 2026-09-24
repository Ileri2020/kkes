import { WebsiteRoute } from "@/components/website-route";
export default async function Department({ params }: { params: Promise<{ department: string }> }) { const { department } = await params; return <WebsiteRoute section={department} />; }
