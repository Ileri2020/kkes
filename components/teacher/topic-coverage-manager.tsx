"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronDown, ChevronRight, ClipboardList, LoaderCircle, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────

type SubSubjectSummary = {
  id: string;
  name: string;
  code: string | null;
  departments: { id: string; name: string }[];
  _count: { topicCoverages: number };
};

type Group = {
  id: string;
  name: string;
  departments: { id: string; name: string }[];
  subSubjects: SubSubjectSummary[];
};

type Department = { id: string; name: string };

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.error === "string" ? body.error : "Something went wrong. Please try again.";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TopicCoverageManager() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [filterBy, setFilterBy] = useState<"name" | "department">("name");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set());

  const normalizedFilter = filter.trim().toLocaleLowerCase();
  const filteredGroups = groups.flatMap((group) => {
    let matchingSubSubjects = group.subSubjects;

    if (filterBy === "name" && normalizedFilter) {
      const parentMatches = group.name.toLocaleLowerCase().includes(normalizedFilter);
      matchingSubSubjects = parentMatches
        ? group.subSubjects
        : group.subSubjects.filter((sub) => [sub.name, sub.code ?? ""]
            .some((value) => value.toLocaleLowerCase().includes(normalizedFilter)));
    }

    if (filterBy === "department" && selectedDepartments.size > 0) {
      const parentMatches = group.departments.some((department) => selectedDepartments.has(department.id));
      matchingSubSubjects = parentMatches
        ? matchingSubSubjects
        : matchingSubSubjects.filter((sub) => sub.departments.some((department) => selectedDepartments.has(department.id)));
    }

    return matchingSubSubjects.length ? [{ ...group, visibleSubSubjects: matchingSubSubjects }] : [];
  });

  useEffect(() => {
    fetch("/api/teacher/topic-coverage", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await responseError(r));
        return r.json();
      })
      .then((data) => {
        setGroups(data.groups ?? []);
        if (data.groups?.length > 0) setOpenGroup(data.groups[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load sub-subjects."))
      .finally(() => setLoading(false));

    fetch("/api/teacher/departments", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return response.json();
      })
      .then((data) => setDepartments(data.departments ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load departments."));
  }, []);

  function toggleDepartment(departmentId: string) {
    setSelectedDepartments((current) => {
      const next = new Set(current);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  }

  function changeFilterBy(value: "name" | "department") {
    setFilterBy(value);
    setFilter("");
    setSelectedDepartments(new Set());
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading sub-subjects…
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">{error}</div>;
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border border-dashed border-border py-20 text-center">
        <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium">No sub-subjects found</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Create sub-subjects in the <a href="/teacher/subjects" className="text-accent underline">Subjects</a> page first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select a sub-subject to view and manage its weekly topic coverage plan.
      </p>

      <div className="max-w-3xl space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-end">
          <label className="space-y-1.5 text-sm font-medium">
            <span>Filter by</span>
            <Select value={filterBy} onValueChange={(value) => changeFilterBy(value as "name" | "department")}>
              <SelectTrigger aria-label="Filter by">
                <SelectValue placeholder="Choose filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="department">Department</SelectItem>
              </SelectContent>
            </Select>
          </label>

          {filterBy === "name" && (
            <label htmlFor="topic-coverage-filter" className="relative block space-y-1.5 text-sm font-medium">
              <span>Subject name</span>
              <span className="relative block">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="topic-coverage-filter"
                  type="search"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Type a subject name or code"
                  className="w-full rounded-md border border-border bg-background py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {filter && (
                  <button type="button" onClick={() => setFilter("")} aria-label="Clear name filter" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </span>
            </label>
          )}
        </div>

        {filterBy === "department" && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Select one or more departments</p>
              {selectedDepartments.size > 0 && (
                <button type="button" onClick={() => setSelectedDepartments(new Set())} className="text-xs text-accent hover:underline">Clear selection</button>
              )}
            </div>
            {departments.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {departments.map((department) => {
                  const selected = selectedDepartments.has(department.id);
                  return (
                    <button
                      key={department.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleDepartment(department.id)}
                      className={`flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${selected ? "border-accent bg-accent/10 text-accent" : "border-border bg-background hover:border-accent/50 hover:bg-foreground/5"}`}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-accent bg-accent text-accent-foreground" : "border-muted-foreground/50"}`}>
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="truncate">{department.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">No departments found for this school.</p>
            )}
          </div>
        )}

        {(filterBy === "name" && normalizedFilter || filterBy === "department" && selectedDepartments.size > 0) && (
          <p className="text-xs text-muted-foreground">
            {filteredGroups.reduce((total, group) => total + group.visibleSubSubjects.length, 0)} matching sub-subjects
          </p>
        )}
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {filteredGroups.map((group) => {
          const isOpen = openGroup === group.id;
          const totalCoverage = group.visibleSubSubjects.reduce((sum, s) => sum + s._count.topicCoverages, 0);

          return (
            <div key={group.id}>
              {/* Accordion header — parent subject */}
              <button
                type="button"
                id={`accordion-${group.id}`}
                aria-expanded={isOpen}
                onClick={() => setOpenGroup(isOpen ? null : group.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-foreground/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span className="font-semibold">{group.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {group.visibleSubSubjects.length} sub-subject{group.visibleSubSubjects.length !== 1 ? "s" : ""}
                  </Badge>
                  {group.departments.map((department) => (
                    <Badge key={department.id} variant="outline" className="hidden text-xs sm:inline-flex">{department.name}</Badge>
                  ))}
                  {totalCoverage > 0 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {totalCoverage} week{totalCoverage !== 1 ? "s" : ""} planned
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {/* Accordion body — sub-subject list */}
              {isOpen && (
                <ul className="divide-y divide-border/60 bg-foreground/5">
                  {group.visibleSubSubjects.map((sub) => (
                    <li key={sub.id}>
                      <button
                        type="button"
                        id={`sub-${sub.id}`}
                        onClick={() => router.push(`/teacher/topic-coverage/${sub.id}`)}
                        className="flex w-full items-center justify-between gap-3 px-8 py-3 text-left text-sm transition hover:bg-foreground/10"
                      >
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{sub.name}</span>
                          {sub.departments.map((department) => (
                            <Badge key={department.id} variant="outline" className="hidden text-xs md:inline-flex">{department.name}</Badge>
                          ))}
                          {sub.code && (
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                              {sub.code}
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {sub._count.topicCoverages > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {sub._count.topicCoverages} week{sub._count.topicCoverages !== 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">No coverage yet</span>
                          )}
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {filteredGroups.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium">No matching subjects</p>
            <p className="mt-1 text-xs text-muted-foreground">Try another name or select different departments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
