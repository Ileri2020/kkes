"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronDown, ChevronRight, ClipboardList, LoaderCircle, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Department = { id: string; name: string };
type SubSubject = { id: string; name: string; code: string | null; departments: Department[]; _count: { topicCoverages: number } };
type SubjectGroup = { id: string; name: string; departments: Department[]; subSubjects: SubSubject[] };

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.error === "string" ? body.error : "Something went wrong. Please try again.";
}

export function MediaSubjectManager() {
  const router = useRouter();
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<"name" | "department">("name");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set());

  const normalizedName = nameFilter.trim().toLocaleLowerCase();
  const filteredGroups = groups.flatMap((group) => {
    let subjects = group.subSubjects;
    if (filterBy === "name" && normalizedName) {
      const parentMatches = group.name.toLocaleLowerCase().includes(normalizedName);
      subjects = parentMatches ? subjects : subjects.filter((subject) => [subject.name, subject.code ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(normalizedName)));
    }
    if (filterBy === "department" && selectedDepartments.size) {
      const parentMatches = group.departments.some((department) => selectedDepartments.has(department.id));
      subjects = parentMatches ? subjects : subjects.filter((subject) => subject.departments.some((department) => selectedDepartments.has(department.id)));
    }
    return subjects.length ? [{ ...group, visibleSubSubjects: subjects }] : [];
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/topic-coverage", { cache: "no-store" }),
      fetch("/api/teacher/departments", { cache: "no-store" }),
    ])
      .then(async ([subjectsResponse, departmentsResponse]) => {
        if (!subjectsResponse.ok) throw new Error(await responseError(subjectsResponse));
        if (!departmentsResponse.ok) throw new Error(await responseError(departmentsResponse));
        const [subjectsData, departmentsData] = await Promise.all([subjectsResponse.json(), departmentsResponse.json()]);
        const items = subjectsData.groups ?? [];
        setGroups(items);
        setDepartments(departmentsData.departments ?? []);
        if (items.length) setOpenGroup(items[0].id);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load subjects."))
      .finally(() => setLoading(false));
  }, []);

  function setMode(mode: "name" | "department") {
    setFilterBy(mode);
    setNameFilter("");
    setSelectedDepartments(new Set());
  }

  function toggleDepartment(id: string) {
    setSelectedDepartments((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleCount = useMemo(() => filteredGroups.reduce((count, group) => count + group.visibleSubSubjects.length, 0), [filteredGroups]);

  if (loading) return <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading subjects…</div>;
  if (error) return <div role="alert" className="border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">{error}</div>;
  if (!groups.length) return <div className="flex flex-col items-center gap-3 border border-dashed border-border py-20 text-center"><ClipboardList className="h-10 w-10 text-muted-foreground/40" /><p className="text-sm font-medium">No sub-subjects found</p><p className="max-w-xs text-xs text-muted-foreground">Create sub-subjects in the <a href="/teacher/subjects" className="text-accent underline">Subjects</a> page first.</p></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a sub-subject to view and manage its saved learning media.</p>
      </div>

      <section className="max-w-3xl space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-end">
          <label className="space-y-1.5 text-sm font-medium"><span>Filter by</span>
            <Select value={filterBy} onValueChange={(value) => setMode(value as "name" | "department")}>
              <SelectTrigger aria-label="Filter by"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="name">Name</SelectItem><SelectItem value="department">Department</SelectItem></SelectContent>
            </Select>
          </label>
          {filterBy === "name" && <label htmlFor="media-subject-filter" className="space-y-1.5 text-sm font-medium"><span>Subject name</span><span className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input id="media-subject-filter" type="search" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="Type a subject name or code" className="w-full rounded-md border border-border bg-background py-2.5 pl-9 pr-10 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />{nameFilter && <button type="button" aria-label="Clear name filter" onClick={() => setNameFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-foreground/5"><X className="h-4 w-4" /></button>}</span></label>}
        </div>
        {filterBy === "department" && <div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">Select one or more departments</p>{selectedDepartments.size > 0 && <button type="button" onClick={() => setSelectedDepartments(new Set())} className="text-xs text-accent hover:underline">Clear selection</button>}</div>{departments.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{departments.map((department) => { const selected = selectedDepartments.has(department.id); return <button type="button" key={department.id} aria-pressed={selected} onClick={() => toggleDepartment(department.id)} className={`flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${selected ? "border-accent bg-accent/10 text-accent" : "border-border bg-background hover:border-accent/50 hover:bg-foreground/5"}`}><span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-accent bg-accent text-accent-foreground" : "border-muted-foreground/50"}`}>{selected && <Check className="h-3 w-3" />}</span><span className="truncate">{department.name}</span></button>; })}</div> : <p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">No departments found for this school.</p>}</div>}
        {(filterBy === "name" && normalizedName || filterBy === "department" && selectedDepartments.size > 0) && <p className="text-xs text-muted-foreground">{visibleCount} matching sub-subjects</p>}
      </section>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {filteredGroups.map((group) => {
          const isOpen = openGroup === group.id;
          const planned = group.visibleSubSubjects.reduce((total, subject) => total + subject._count.topicCoverages, 0);
          return <div key={group.id}>
            <button type="button" id={`media-accordion-${group.id}`} aria-expanded={isOpen} onClick={() => setOpenGroup(isOpen ? null : group.id)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-foreground/5">
              <div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent"><BookOpen className="h-4 w-4" /></span><span className="truncate font-semibold">{group.name}</span><Badge variant="secondary" className="shrink-0 text-xs">{group.visibleSubSubjects.length} sub-subject{group.visibleSubSubjects.length !== 1 ? "s" : ""}</Badge>{group.departments.map((department) => <Badge key={department.id} variant="outline" className="hidden text-xs sm:inline-flex">{department.name}</Badge>)}{planned > 0 && <Badge variant="outline" className="hidden text-xs text-muted-foreground md:inline-flex">{planned} planned</Badge>}</div>
              {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>
            {isOpen && <ul className="divide-y divide-border/60 bg-foreground/5">{group.visibleSubSubjects.map((subject) => <li key={subject.id}><button type="button" id={`media-subject-${subject.id}`} onClick={() => router.push(`/teacher/media/${subject.id}`)} className="flex w-full items-center justify-between gap-3 px-8 py-3 text-left text-sm transition hover:bg-foreground/10"><span className="flex min-w-0 items-center gap-2"><ClipboardList className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{subject.name}</span>{subject.departments.map((department) => <Badge key={department.id} variant="outline" className="hidden text-xs md:inline-flex">{department.name}</Badge>)}{subject.code && <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono text-muted-foreground">{subject.code}</span>}</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></button></li>)}</ul>}
          </div>;
        })}
        {filteredGroups.length === 0 && <div className="px-5 py-12 text-center"><p className="text-sm font-medium">No matching subjects</p><p className="mt-1 text-xs text-muted-foreground">Try another name or select different departments.</p></div>}
      </div>
    </div>
  );
}
