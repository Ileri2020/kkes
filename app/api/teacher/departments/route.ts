import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";

export async function GET() {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const departments = await prisma.department.findMany({ where: { schoolId: scope.schoolId }, orderBy: { name: "asc" } });
    return NextResponse.json({ departments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Teacher departments load failed:", error);
    return NextResponse.json({ error: "Unable to load departments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Enter a department name of 1–80 characters." }, { status: 400 });
    }

    const existing = await prisma.department.findMany({ where: { schoolId: scope.schoolId }, select: { name: true } });
    if (existing.some((department) => department.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return NextResponse.json({ error: "That department already exists in this school." }, { status: 409 });
    }

    const department = await prisma.department.create({ data: { schoolId: scope.schoolId, name } });
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error("Teacher department creation failed:", error);
    return NextResponse.json({ error: "Unable to create the department." }, { status: 500 });
  }
}
