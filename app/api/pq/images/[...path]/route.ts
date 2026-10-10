import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const supportedExamTypes = new Set(["jamb", "waec", "neco"]);
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
  const hasExamPrefix = supportedExamTypes.has(segments[0]);
  const examType = hasExamPrefix ? segments[0] : "jamb";
  const imageSegments = hasExamPrefix ? segments.slice(1) : segments;
  if (!imageSegments.length) {
    return new Response("Not found", { status: 404 });
  }

  const imageRoot = path.resolve(process.cwd(), "pq", examType, "json", "images");
  const filePath = path.resolve(imageRoot, ...imageSegments);
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