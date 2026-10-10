"use client";

import Link from "next/link";
import { BookOpen, Plus, Users } from "lucide-react";
import { DepartmentCreateButton } from "@/components/teacher/department-create-button";

export function TeacherDashboardActions() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Quickly set up your school workspace.</p>
        <p className="mt-1 text-xs text-muted-foreground">Create classes, subjects, and departments for this school.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher/classes" className="inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"><Plus className="h-4 w-4" /><Users className="h-4 w-4" /> Create class</Link>
        <Link href="/teacher/subjects" className="inline-flex items-center gap-2 border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent"><Plus className="h-4 w-4" /><BookOpen className="h-4 w-4" /> Create subject</Link>
        <DepartmentCreateButton />
      </div>
    </section>
  );
}
