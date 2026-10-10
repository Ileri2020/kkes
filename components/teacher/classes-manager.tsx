"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, LoaderCircle, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DepartmentCreateButton } from "@/components/teacher/department-create-button";

// ─── Types ───────────────────────────────────────────────────────────────────

type Teacher = { id: string; name: string | null; email: string };
type SubjectItem = { id: string; name: string };
type SchoolClass = {
  id: string;
  name: string;
  level: string | null;
  year: string | null;
  department: string | null;
  classTeacher: Teacher | null;
  subjects: SubjectItem[];
};

// Full subject shape fetched from /api/teacher/subjects
type SubjectFull = {
  id: string;
  name: string;
  code: string | null;
  departmentIds: string[];
  parentSubjectId: string | null;
  parentSubject: SubjectItem | null;
  subSubjects: SubjectItem[];
  classIds: string[];
};

// A "row" shown in the accordion — either a sub-subject or a top-level subject (when no sub-subjects)
type SubjectRow = {
  id: string;
  name: string;
  parentId: string;        // id of the accordion group (parent subject)
  parentName: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const start = now.getMonth() >= 6 ? year : year - 1;
  return `${start}/${start + 1}`;
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.error === "string" ? body.error : "Something went wrong. Please try again.";
}

// ─── Add-Subjects Dialog ──────────────────────────────────────────────────────

interface AddSubjectsDialogProps {
  open: boolean;
  schoolClass: SchoolClass | null;
  onClose: () => void;
  onSaved: (updated: SchoolClass) => void;
}

function AddSubjectsDialog({ open, schoolClass, onClose, onSaved }: AddSubjectsDialogProps) {
  const [subjects, setSubjects] = useState<SubjectFull[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const hasFetchedRef = useRef(false);

  // Load subjects once when dialog first opens
  useEffect(() => {
    if (!open || !schoolClass) return;
    // Pre-select already assigned subjects
    setSelected(new Set(schoolClass.subjects.map((s) => s.id)));
    setSearch("");
    setSaveError("");
    setOpenGroup(null);

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setLoadingSubjects(true);
    fetch("/api/teacher/subjects", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await responseError(r));
        return r.json();
      })
      .then((data) => setSubjects(data.subjects ?? []))
      .catch((err) => setSubjectsError(err instanceof Error ? err.message : "Unable to load subjects."))
      .finally(() => setLoadingSubjects(false));
  }, [open, schoolClass]);

  // Focus search when dialog opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  // Build accordion groups: parent subjects that have sub-subjects.
  // Top-level subjects with NO sub-subjects appear as their own group.
  const groups = useMemo<{ parentId: string; parentName: string; rows: SubjectRow[] }[]>(() => {
    // Only include subjects that have a parentSubjectId (they are sub-subjects)
    // Group them by parentSubjectId
    const parentMap = new Map<string, { parentName: string; rows: SubjectRow[] }>();

    for (const subject of subjects) {
      if (subject.parentSubjectId && subject.parentSubject) {
        const { id: parentId, name: parentName } = subject.parentSubject;
        if (!parentMap.has(parentId)) {
          parentMap.set(parentId, { parentName, rows: [] });
        }
        parentMap.get(parentId)!.rows.push({
          id: subject.id,
          name: subject.name,
          parentId,
          parentName,
        });
      }
    }

    // Also include top-level subjects that have NO sub-subjects as their own single-item group
    for (const subject of subjects) {
      if (!subject.parentSubjectId && subject.subSubjects.length === 0) {
        if (!parentMap.has(subject.id)) {
          parentMap.set(subject.id, {
            parentName: subject.name,
            rows: [{ id: subject.id, name: subject.name, parentId: subject.id, parentName: subject.name }],
          });
        }
      }
    }

    return Array.from(parentMap.entries())
      .map(([parentId, { parentName, rows }]) => ({ parentId, parentName, rows }))
      .sort((a, b) => a.parentName.localeCompare(b.parentName));
  }, [subjects]);

  // Apply search filter
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => row.name.toLowerCase().includes(q) || group.parentName.toLowerCase().includes(q)),
      }))
      .filter((group) => group.rows.length > 0);
  }, [groups, search]);

  // Auto-expand first group when searching
  useEffect(() => {
    if (search.trim() && filteredGroups.length > 0) {
      setOpenGroup(filteredGroups[0].parentId);
    }
  }, [search, filteredGroups]);

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(group: { rows: SubjectRow[] }) {
    const allSelected = group.rows.every((r) => selected.has(r.id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) group.rows.forEach((r) => next.delete(r.id));
      else group.rows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  async function handleSave() {
    if (!schoolClass) return;
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(`/api/teacher/classes/${schoolClass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectIds: Array.from(selected) }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      onSaved(data.class as SchoolClass);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save subjects.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = selected.size;
  const totalVisible = filteredGroups.reduce((sum, g) => sum + g.rows.length, 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !saving) onClose(); }}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            Add Subjects to {schoolClass?.name}
          </DialogTitle>
          <DialogDescription>
            Select sub-subjects for this class. Sub-subjects are grouped by their parent subject.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            id="add-subjects-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects…"
            className="pl-9"
          />
        </div>

        {/* Selection summary */}
        {selectedCount > 0 && (
          <div className="flex shrink-0 items-center justify-between rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
            <span className="font-medium text-accent">{selectedCount} sub-subject{selectedCount !== 1 ? "s" : ""} selected</span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Accordion list */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border">
          {loadingSubjects ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Loading subjects…
            </div>
          ) : subjectsError ? (
            <div className="px-4 py-6 text-center text-sm text-destructive">{subjectsError}</div>
          ) : filteredGroups.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {search ? "No subjects match your search." : "No sub-subjects found. Create them in the Subjects page first."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredGroups.map((group) => {
                const isOpen = openGroup === group.parentId;
                const groupSelected = group.rows.filter((r) => selected.has(r.id)).length;
                const allGroupSelected = groupSelected === group.rows.length;
                const someGroupSelected = groupSelected > 0 && !allGroupSelected;

                return (
                  <li key={group.parentId}>
                    {/* Accordion header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Group checkbox */}
                      <Checkbox
                        id={`group-${group.parentId}`}
                        checked={allGroupSelected}
                        data-state={someGroupSelected ? "indeterminate" : allGroupSelected ? "checked" : "unchecked"}
                        onCheckedChange={() => toggleGroup(group)}
                        className="shrink-0"
                        aria-label={`Select all ${group.parentName} sub-subjects`}
                      />
                      {/* Toggle button */}
                      <button
                        type="button"
                        className="flex flex-1 items-center justify-between gap-2 text-left"
                        onClick={() => setOpenGroup(isOpen ? null : group.parentId)}
                        aria-expanded={isOpen}
                        id={`accordion-btn-${group.parentId}`}
                      >
                        <span className="font-semibold text-sm">{group.parentName}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          {groupSelected > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {groupSelected}/{group.rows.length}
                            </Badge>
                          )}
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Accordion body */}
                    {isOpen && (
                      <ul className="divide-y divide-border/50 bg-foreground/5">
                        {group.rows.map((row) => (
                          <li key={row.id}>
                            <label
                              htmlFor={`subj-${row.id}`}
                              className="flex cursor-pointer items-center gap-3 px-6 py-2.5 hover:bg-foreground/10"
                            >
                              <Checkbox
                                id={`subj-${row.id}`}
                                checked={selected.has(row.id)}
                                onCheckedChange={() => toggleRow(row.id)}
                                className="shrink-0"
                              />
                              <span className="text-sm">{row.name}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {saveError && (
          <p role="alert" className="shrink-0 text-sm text-destructive">{saveError}</p>
        )}
        <DialogFooter className="shrink-0 gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            id="save-class-subjects-btn"
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loadingSubjects}
          >
            {saving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Save {selectedCount > 0 ? `${selectedCount} subject${selectedCount !== 1 ? "s" : ""}` : "changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TeacherClassesManager() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [addSubjectsClass, setAddSubjectsClass] = useState<SchoolClass | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState(currentAcademicYear);
  const [department, setDepartment] = useState("");
  const [classTeacherId, setClassTeacherId] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/teacher/classes", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setClasses(data.classes ?? []);
        setTeachers(data.teachers ?? []);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load classes.");
      })
      .finally(() => { if (active) setLoading(false); });
    fetch("/api/teacher/departments", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { departments: [] })
      .then((data) => { if (active) setDepartments((data.departments ?? []).map((item: { name: string }) => item.name)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  function resetForm() {
    setEditingClass(null);
    setName("");
    setYear(currentAcademicYear());
    setDepartment("");
    setClassTeacherId("");
    setFormError("");
  }

  function editClass(schoolClass: SchoolClass) {
    setEditingClass(schoolClass);
    setName(schoolClass.name);
    setYear(schoolClass.year ?? "");
    setDepartment(schoolClass.department ?? "");
    setClassTeacherId(schoolClass.classTeacher?.id ?? "");
    setFormError("");
    setDialogOpen(true);
  }

  async function saveClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      const response = await fetch(editingClass ? `/api/teacher/classes/${editingClass.id}` : "/api/teacher/classes", {
        method: editingClass ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, year, department, classTeacherId: classTeacherId || null }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      const savedClass = data.class as SchoolClass;
      setClasses((current) =>
        [
          ...current.filter((item) => item.id !== savedClass.id),
          savedClass,
        ].sort((left, right) => left.name.localeCompare(right.name) || String(left.year).localeCompare(String(right.year)))
      );
      setDialogOpen(false);
      resetForm();
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : "Unable to create the class.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteClass() {
    if (!classToDelete) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/classes/${classToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response));
      setClasses((current) => current.filter((schoolClass) => schoolClass.id !== classToDelete.id));
      setClassToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the class.");
    } finally {
      setDeleting(false);
    }
  }

  function handleSubjectsSaved(updated: SchoolClass) {
    setClasses((current) =>
      current.map((cls) => (cls.id === updated.id ? updated : cls))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Manage school classes, class teachers, and the subjects offered.</p>
          <p className="mt-1 text-xs text-muted-foreground">Default classes are added automatically when this page is first opened.</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <DepartmentCreateButton onCreated={(newDepartment) => setDepartments((current) => [...new Set([...current, newDepartment])].sort())} />
          <Link href="/teacher/subjects" className="inline-flex items-center justify-center gap-2 border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent">
            <BookOpen className="h-4 w-4" /> Create subject
          </Link>
          <button
            type="button"
            id="create-class-btn"
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="inline-flex items-center justify-center gap-2 bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create class
          </button>
        </div>
      </div>

      {error && <div role="alert" className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Loading classes…
        </div>
      ) : classes.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((schoolClass) => (
            <article key={schoolClass.id} className="border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Users className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-semibold">{schoolClass.name}</h2>
                </div>
                <div className="flex items-center gap-1">
                  {schoolClass.level && (
                    <span className="mr-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{schoolClass.level}</span>
                  )}
                  <button
                    type="button"
                    aria-label={`Edit ${schoolClass.name}`}
                    title="Edit class"
                    onClick={() => editClass(schoolClass)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${schoolClass.name}`}
                    title="Delete class"
                    onClick={() => setClassToDelete(schoolClass)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Academic year</dt>
                  <dd className="text-right">{schoolClass.year || "Not set"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Department</dt>
                  <dd className="text-right">{schoolClass.department || "Not assigned"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Class teacher</dt>
                  <dd className="max-w-[60%] text-right">{schoolClass.classTeacher?.name || schoolClass.classTeacher?.email || "Not assigned"}</dd>
                </div>
              </dl>

              {/* Subjects section */}
              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" /> Subjects offered
                  </p>
                  <button
                    type="button"
                    id={`add-subjects-${schoolClass.id}`}
                    onClick={() => setAddSubjectsClass(schoolClass)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium transition hover:border-accent hover:text-accent"
                  >
                    <Plus className="h-3 w-3" />
                    Add subjects
                  </button>
                </div>
                {schoolClass.subjects.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {schoolClass.subjects.map((subject) => (
                      <span key={subject.id} className="rounded-full border border-border px-2.5 py-1 text-xs">
                        {subject.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No subjects assigned yet.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">No classes found.</div>
      )}

      {/* Create / Edit Class Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit class" : "Create class"}</DialogTitle>
            <DialogDescription>
              {editingClass ? "Update this class details." : "Add a class to your school."} Department and class teacher are optional.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveClass} className="space-y-4">
            <Label className="block space-y-1.5">
              <span>Class name <span className="text-destructive">*</span></span>
              <input
                required
                maxLength={60}
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. JSS1 B"
                className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Label>
            <Label className="block space-y-1.5">
              <span>Academic year</span>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026/2027"
                className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Label>
            <Label className="block space-y-1.5">
              <span>Department <span className="font-normal text-muted-foreground">(optional)</span></span>
              <input
                list="school-departments"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Science"
                className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <datalist id="school-departments">
                {departments.map((item) => <option key={item} value={item} />)}
              </datalist>
            </Label>
            <Label className="block space-y-1.5">
              <span>Class teacher <span className="font-normal text-muted-foreground">(optional)</span></span>
              <select
                value={classTeacherId}
                onChange={(e) => setClassTeacherId(e.target.value)}
                className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No class teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name || teacher.email}</option>
                ))}
              </select>
            </Label>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <DialogFooter className="pt-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {editingClass ? "Save changes" : "Create class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Subjects Dialog */}
      <AddSubjectsDialog
        open={Boolean(addSubjectsClass)}
        schoolClass={addSubjectsClass}
        onClose={() => setAddSubjectsClass(null)}
        onSaved={handleSubjectsSaved}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={Boolean(classToDelete)} onOpenChange={(open) => { if (!open && !deleting) setClassToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {classToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the class and its subject offerings. Students, tests, and assignments will be unlinked from it; those records will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => { event.preventDefault(); void deleteClass(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
