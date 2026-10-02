import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const imageRoot = path.resolve(process.cwd(), "pq", "json", "images");
const contentTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const filePath = path.resolve(imageRoot, ...segments);
  if (!filePath.startsWith(`${imageRoot}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = contentTypes[path.extname(filePath).toLowerCase()];
  if (!contentType) return new Response("Not found", { status: 404 });

  try {
    const image = await readFile(filePath);
    return new Response(image, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}