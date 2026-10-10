import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type RouteContext = { params: Promise<{ subjectId: string }> };
type MediaKind = "VIDEO" | "AUDIO" | "DOCUMENT" | "PDF";
const supportedKinds = new Set<MediaKind>(["VIDEO", "AUDIO", "DOCUMENT", "PDF"]);

/** GET /api/teacher/media/[subjectId] — list media directly assigned to the subject or linked through one of its topics. */
export async function GET(_request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { subjectId } = await params;
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: scope.schoolId, parentSubjectId: { not: null } },
      select: { id: true, name: true, code: true, parentSubject: { select: { id: true, name: true } } },
    });
    if (!subject) return NextResponse.json({ error: "Sub-subject not found." }, { status: 404 });

    const media = await prisma.media.findMany({
      where: {
        schoolId: scope.schoolId,
        OR: [
          { subjectId },
          { topic: { is: { subjectId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { mediaType: { select: { name: true } }, topic: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ subject, media }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Teacher subject media load failed:", error);
    return NextResponse.json({ error: "Unable to load subject media." }, { status: 500 });
  }
}

/** POST /api/teacher/media/[subjectId] — upload an asset to Cloudinary and save its record. */
export async function POST(request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const session = await auth();
    const uploadedById = session?.user?.id;
    if (!uploadedById) return NextResponse.json({ error: "Sign in before uploading media." }, { status: 401 });

    const { subjectId } = await params;
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: scope.schoolId, parentSubjectId: { not: null } },
      select: { id: true },
    });
    if (!subject) return NextResponse.json({ error: "Sub-subject not found." }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const kindValue = String(formData.get("kind") ?? "").toUpperCase() as MediaKind;
    if (!supportedKinds.has(kindValue)) return NextResponse.json({ error: "Choose video, audio, or document media." }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Select a file to upload." }, { status: 400 });
    if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: "Files must be 100 MB or smaller." }, { status: 413 });

    const user = await prisma.user.findUnique({ where: { id: uploadedById }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "The signed-in account could not be found." }, { status: 401 });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Cloudinary is not configured on the server." }, { status: 503 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
    const resourceType = kindValue === "VIDEO" || kindValue === "AUDIO" ? "video" : "raw";
    const uploaded = await cloudinary.uploader.upload(dataUri, {
      resource_type: resourceType,
      folder: `school-media/${scope.schoolId}/${subjectId}`,
      use_filename: true,
      unique_filename: true,
      filename_override: file.name,
    });

    const mediaType = await prisma.mediaType.upsert({
      where: { name: kindValue },
      update: {},
      create: { name: kindValue },
      select: { id: true },
    });
    const media = await prisma.media.create({
      data: {
        schoolId: scope.schoolId,
        subjectId,
        uploadedById,
        mediaTypeId: mediaType.id,
        kind: kindValue,
        title: title || file.name,
        description: description || null,
        fileUrl: uploaded.secure_url,
        isPublic: true,
      },
      include: { mediaType: { select: { name: true } } },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error("Teacher media upload failed:", error);
    return NextResponse.json({ error: "Unable to upload and save this media." }, { status: 500 });
  }
}
