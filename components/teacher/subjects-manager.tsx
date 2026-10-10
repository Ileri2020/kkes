"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Layers, LoaderCircle, Pencil, Plus, Search, Trash2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DepartmentCreateButton } from "@/components/teacher/department-create-button";

type DepartmentItem = { id: string; name: string };
type SubSubjectObj = { id: string; name: string; code: string | null; departmentIds?: string[]; departments?: DepartmentItem[] };
type Subject = {
  id: string;
  name: string;
  code: string | null;
  departmentIds?: string[];
  departments?: DepartmentItem[];
  parentSubjectId?: string | null;
  parentSubject?: { id: string; name: string } | null;
  subSubjects?: SubSubjectObj[];
  classIds?: string[];
};
type SchoolClass = { id: string; name: string; level: string | null; year: string | null; department: string | null };

type DefaultSubSubjectCandidate = {
  name: string;
  code: string | null;
  departmentIds: string[];
  selected: boolean;
  alreadyExists: boolean;
};

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.error === "string" ? body.error : "Something went wrong. Please try again.";
}

function getCommonSubSubjectSuggestions(parentName: string): string[] {
  if (!parentName || !parentName.trim()) return [];
  const base = parentName.trim();
  return [
    `${base} (JSS 1)`,
    `${base} (JSS 2)`,
    `${base} (JSS 3)`,
    `${base} (SS 1)`,
    `${base} (SS 2)`,
    `${base} (SS 3)`,
    `${base} (Basic 1)`,
    `${base} (Basic 2)`,
    `${base} (Basic 3)`,
    `${base} (Basic 4)`,
    `${base} (Basic 5)`,
    `${base} (Basic 6)`,
    `${base} (Basic 7)`,
    `${base} (Basic 8)`,
    `${base} (Basic 9)`,
    `${base} (Primary 1)`,
    `${base} (Primary 2)`,
    `${base} (Primary 3)`,
    `${base} (Primary 4)`,
    `${base} (Primary 5)`,
    `${base} (Primary 6)`,
    `${base} (Junior)`,
    `${base} (Senior)`,
    `${base} (Theory)`,
    `${base} (Practical)`,
  ];
}

function generateDefaultSubSubjectCandidates(
  parentSubject: Subject,
  allDepartments: DepartmentItem[],
  existingSubjects: Subject[]
): DefaultSubSubjectCandidate[] {
  const parentName = parentSubject.name.trim();
  const parentDeptIds = parentSubject.departmentIds || [];
  const existingNamesSet = new Set(existingSubjects.map((s) => s.name.trim().toLowerCase()));

  // Resolve assigned department names
  const assignedDeptNames = (parentSubject.departments || []).map((d) => d.name.toLowerCase());
  const deptNameStrings = assignedDeptNames.length > 0
    ? assignedDeptNames
    : allDepartments
        .filter((d) => parentDeptIds.includes(d.id))
        .map((d) => d.name.toLowerCase());

  // Rule mappings:
  // 1. Science, Art, Commercial -> SS 1 to SS 3
  // 2. JSS -> JSS 1 to JSS 3
  // 3. Primary -> Primary 1 to Primary 6
  const hasSenior = deptNameStrings.some((n) => /science|art|commercial|senior|ss/i.test(n));
  const hasJSS = deptNameStrings.some((n) => /jss|junior/i.test(n));
  const hasPrimary = deptNameStrings.some((n) => /primary|basic|nursery/i.test(n));

  const candidateLevels: string[] = [];

  if (hasPrimary) {
    candidateLevels.push("Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6");
  }

  if (hasJSS) {
    candidateLevels.push("JSS 1", "JSS 2", "JSS 3");
  }

  if (hasSenior) {
    candidateLevels.push("SS 1", "SS 2", "SS 3");
  }

  // Fallback if no specific department matched (or subject has no assigned departments)
  if (candidateLevels.length === 0) {
    candidateLevels.push("JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3");
  }

  const uniqueLevels = [...new Set(candidateLevels)];

  return uniqueLevels.map((level) => {
    const candidateName = `${parentName} (${level})`;
    const alreadyExists = existingNamesSet.has(candidateName.toLowerCase());

    let subCode: string | null = null;
    if (parentSubject.code) {
      const shortLevel = level.replace(/\s+/g, "").toUpperCase();
      subCode = `${parentSubject.code}-${shortLevel}`;
    }

    return {
      name: candidateName,
      code: subCode,
      departmentIds: parentDeptIds,
      selected: !alreadyExists, // default all checkboxes to true unless already in DB
      alreadyExists,
    };
  });
}

export function TeacherSubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  
  const [activeTab, setActiveTab] = useState("main-subjects");
  const [dialogTab, setDialogTab] = useState<"subject" | "subsubject">("subject");
  const [editTab, setEditTab] = useState<"details" | "subsubjects">("details");
  
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  
  // Create / Edit Form fields
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [selectedParentSubjectId, setSelectedParentSubjectId] = useState("");
  
  // Inline Sub-Subject form fields for Edit modal
  const [newInlineSubName, setNewInlineSubName] = useState("");
  const [newInlineSubCode, setNewInlineSubCode] = useState("");
  const [newInlineSubDeptIds, setNewInlineSubDeptIds] = useState<string[]>([]);
  const [creatingInlineSub, setCreatingInlineSub] = useState(false);

  // Batch Default Sub-Subjects Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchParentSubject, setBatchParentSubject] = useState<Subject | null>(null);
  const [batchCandidates, setBatchCandidates] = useState<DefaultSubSubjectCandidate[]>([]);
  const [batchCreating, setBatchCreating] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [subjectResponse, classResponse, departmentResponse] = await Promise.all([
        fetch("/api/teacher/subjects", { cache: "no-store" }),
        fetch("/api/teacher/classes", { cache: "no-store" }),
        fetch("/api/teacher/departments", { cache: "no-store" }),
      ]);
      if (!subjectResponse.ok) throw new Error(await responseError(subjectResponse));
      if (!classResponse.ok) throw new Error(await responseError(classResponse));
      
      const subjectData = await subjectResponse.json();
      const classData = await classResponse.json();
      const departmentData = departmentResponse.ok ? await departmentResponse.json() : { departments: [] };
      
      setSubjects(subjectData.subjects ?? []);
      setClasses(classData.classes ?? []);
      setDepartments(departmentData.departments ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load subjects data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const mainSubjects = useMemo(() => subjects.filter((s) => !s.parentSubjectId), [subjects]);
  const subSubjectsList = useMemo(() => subjects.filter((s) => Boolean(s.parentSubjectId)), [subjects]);

  const selectedSubject = useMemo(() => subjects.find((subject) => subject.id === selectedSubjectId), [subjects, selectedSubjectId]);

  const editingSubSubjects = useMemo(() => {
    if (!editingSubject) return [];
    return subjects.filter((s) => s.parentSubjectId === editingSubject.id);
  }, [editingSubject, subjects]);

  const filteredMainSubjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return mainSubjects.filter((subject) => !query || subject.name.toLocaleLowerCase().includes(query) || (subject.code && subject.code.toLocaleLowerCase().includes(query)));
  }, [search, mainSubjects]);

  const filteredSubSubjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return subSubjectsList.filter((subject) => !query || subject.name.toLocaleLowerCase().includes(query) || (subject.parentSubject?.name && subject.parentSubject.name.toLocaleLowerCase().includes(query)));
  }, [search, subSubjectsList]);

  const activeParentSubjectName = useMemo(() => {
    if (editingSubject?.parentSubject?.name) return editingSubject.parentSubject.name;
    const parentObj = mainSubjects.find((s) => s.id === selectedParentSubjectId) || mainSubjects[0];
    return parentObj?.name || "";
  }, [editingSubject, selectedParentSubjectId, mainSubjects]);

  function chooseSubjectForClasses(subject: Subject) {
    setSelectedSubjectId(subject.id);
    setSelectedClassIds(subject.classIds || []);
    setNotice("");
    setActiveTab("classes");
  }

  function toggleDepartment(deptId: string) {
    setSelectedDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  }

  function toggleInlineDepartment(deptId: string) {
    setNewInlineSubDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  }

  function toggleClass(classId: string) {
    setSelectedClassIds((current) =>
      current.includes(classId) ? current.filter((id) => id !== classId) : [...current, classId]
    );
  }

  function openCreateModal(tab: "subject" | "subsubject" = "subject") {
    setEditingSubject(null);
    setDialogTab(tab);
    setEditTab("details");
    setNewSubjectName("");
    setNewSubjectCode("");
    setSelectedDepartmentIds([]);
    setSelectedParentSubjectId(mainSubjects[0]?.id || "");
    setError("");
    setCreateDialogOpen(true);
  }

  function editSubject(subject: Subject) {
    setEditingSubject(subject);
    setEditTab("details");
    setDialogTab(subject.parentSubjectId ? "subsubject" : "subject");
    setNewSubjectName(subject.name);
    setNewSubjectCode(subject.code ?? "");
    setSelectedDepartmentIds(subject.departmentIds || []);
    setSelectedParentSubjectId(subject.parentSubjectId || mainSubjects[0]?.id || "");
    
    setNewInlineSubName("");
    setNewInlineSubCode("");
    setNewInlineSubDeptIds(subject.departmentIds || []);
    
    setError("");
    setNotice("");
    setCreateDialogOpen(true);
  }

  function openBatchSubSubjectModal(parent: Subject) {
    setBatchParentSubject(parent);
    const candidates = generateDefaultSubSubjectCandidates(parent, departments, subjects);
    setBatchCandidates(candidates);
    setError("");
    setBatchModalOpen(true);
  }

  function toggleCandidateSelection(index: number) {
    setBatchCandidates((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  }

  function toggleAllCandidates(selectAll: boolean) {
    setBatchCandidates((prev) =>
      prev.map((item) => (item.alreadyExists ? item : { ...item, selected: selectAll }))
    );
  }

  async function handleBatchCreateSubSubjects() {
    if (!batchParentSubject) return;
    const selectedItems = batchCandidates.filter((c) => c.selected && !c.alreadyExists);
    if (selectedItems.length === 0) {
      setError("Please select at least one sub-subject to create.");
      return;
    }

    setBatchCreating(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentSubjectId: batchParentSubject.id,
          items: selectedItems.map((item) => ({
            name: item.name,
            code: item.code,
            departmentIds: item.departmentIds,
          })),
        }),
      });

      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      const createdList = (data.subjects || []) as Subject[];

      setSubjects((current) => {
        const updated = [...current];
        for (const s of createdList) {
          if (!updated.some((item) => item.id === s.id)) {
            updated.push(s);
          }
        }
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });

      setBatchModalOpen(false);
      setNotice(`Successfully created ${createdList.length} default sub-subjects under ${batchParentSubject.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch sub-subject creation failed.");
    } finally {
      setBatchCreating(false);
    }
  }

  async function saveAssignments() {
    if (!selectedSubject) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/teacher/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: selectedSubject.id, classIds: selectedClassIds }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setSubjects((current) =>
        current.map((subject) =>
          subject.id === selectedSubject.id ? { ...subject, classIds: selectedClassIds } : subject
        )
      );
      setNotice(`${selectedSubject.name} is now assigned to ${selectedClassIds.length} ${selectedClassIds.length === 1 ? "class" : "classes"}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save subject classes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setNotice("");

    const isSubSubject = dialogTab === "subsubject" || Boolean(editingSubject?.parentSubjectId);
    const parentId = isSubSubject ? (editingSubject?.parentSubjectId || selectedParentSubjectId) : null;

    if (isSubSubject && !parentId) {
      setError("Please select a parent subject for this sub-subject.");
      setCreating(false);
      return;
    }

    try {
      const response = await fetch(
        editingSubject ? `/api/teacher/subjects/${editingSubject.id}` : "/api/teacher/subjects",
        {
          method: editingSubject ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newSubjectName,
            code: newSubjectCode,
            departmentIds: selectedDepartmentIds,
            parentSubjectId: parentId,
          }),
        }
      );
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      const returnedSubject = data.subject as Subject;

      setSubjects((current) => {
        const oldSubject = current.find((item) => item.id === returnedSubject.id);
        const normalizedSubject: Subject = {
          ...returnedSubject,
          classIds: returnedSubject.classIds || oldSubject?.classIds || [],
          departmentIds: returnedSubject.departmentIds || oldSubject?.departmentIds || [],
          departments: returnedSubject.departments || oldSubject?.departments || [],
          subSubjects: returnedSubject.subSubjects || oldSubject?.subSubjects || [],
        };
        const updated = [...current.filter((item) => item.id !== normalizedSubject.id), normalizedSubject];
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });

      setNewSubjectName("");
      setNewSubjectCode("");
      setSelectedDepartmentIds([]);
      setCreateDialogOpen(false);
      setEditingSubject(null);
      setNotice(
        `${returnedSubject.name} has been ${editingSubject ? "updated" : "created successfully"}.`
      );
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to save subject.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateInlineSubSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSubject) return;
    setCreatingInlineSub(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newInlineSubName,
          code: newInlineSubCode,
          departmentIds: newInlineSubDeptIds,
          parentSubjectId: editingSubject.id,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      const returnedSubject = data.subject as Subject;

      setSubjects((current) => {
        const oldSubject = current.find((item) => item.id === returnedSubject.id);
        const normalizedSubject: Subject = {
          ...returnedSubject,
          classIds: returnedSubject.classIds || oldSubject?.classIds || [],
          departmentIds: returnedSubject.departmentIds || oldSubject?.departmentIds || [],
          departments: returnedSubject.departments || oldSubject?.departments || [],
          subSubjects: returnedSubject.subSubjects || oldSubject?.subSubjects || [],
        };
        const updated = [...current.filter((item) => item.id !== normalizedSubject.id), normalizedSubject];
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });

      setNewInlineSubName("");
      setNewInlineSubCode("");
      setNotice(`Sub-subject "${returnedSubject.name}" created under ${editingSubject.name}.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create sub-subject.");
    } finally {
      setCreatingInlineSub(false);
    }
  }

  async function deleteSubject() {
    if (!subjectToDelete) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/subjects/${subjectToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response));
      setSubjects((current) => current.filter((subject) => subject.id !== subjectToDelete.id));
      if (selectedSubjectId === subjectToDelete.id) {
        setSelectedSubjectId("");
        setSelectedClassIds([]);
        setActiveTab("main-subjects");
      }
      setNotice(`${subjectToDelete.name} was deleted.`);
      setSubjectToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the subject.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subject Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage school subjects, sub-subjects (e.g. Mathematics JSS1), department assignments, and class offerings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 px-3 py-1.5 text-xs font-normal">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> {mainSubjects.length} Main Subjects
          </Badge>
          <Badge variant="outline" className="gap-1 px-3 py-1.5 text-xs font-normal">
            <Layers className="h-3.5 w-3.5 text-primary" /> {subSubjectsList.length} Sub-Subjects
          </Badge>

          <Button asChild variant="outline" size="sm">
            <Link href="/teacher/classes">
              <Plus className="mr-1 h-4 w-4" /> Create Class
            </Link>
          </Button>

          <Button onClick={() => openCreateModal("subject")} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Subject
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full max-w-lg grid-cols-3">
          <TabsTrigger value="main-subjects" className="py-2 text-xs sm:text-sm">
            Main Subjects ({mainSubjects.length})
          </TabsTrigger>
          <TabsTrigger value="sub-subjects" className="py-2 text-xs sm:text-sm">
            Sub-Subjects ({subSubjectsList.length})
          </TabsTrigger>
          <TabsTrigger value="classes" disabled={!selectedSubject} className="py-2 text-xs sm:text-sm">
            Offering Classes
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Main Subjects */}
        <TabsContent value="main-subjects" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search main subjects by name or code..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => openCreateModal("subject")} variant="secondary" className="gap-1">
              <Plus className="h-4 w-4" /> New Subject
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" /> Loading school subjects...
            </div>
          ) : filteredMainSubjects.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMainSubjects.map((subject) => {
                const subCount = subjects.filter((s) => s.parentSubjectId === subject.id).length;
                const classCount = subject.classIds?.length || 0;
                return (
                  <Card key={subject.id} className="group relative flex flex-col justify-between transition hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editSubject(subject)} title="Edit subject">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setSubjectToDelete(subject)} title="Delete subject">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-lg font-semibold">{subject.name}</CardTitle>
                      {subject.code && <CardDescription>Code: {subject.code}</CardDescription>}
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      {/* Departments */}
                      <div className="flex flex-wrap gap-1.5">
                        {subject.departments && subject.departments.length > 0 ? (
                          subject.departments.map((dept) => (
                            <Badge key={dept.id} variant="secondary" className="text-xs font-normal">
                              {dept.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No departments assigned</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <span>{subCount} Sub-subjects</span>
                        <span>{classCount} Classes</span>
                      </div>

                      {/* Batch Create Sub-subjects Button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 border-transparent"
                        onClick={() => openBatchSubSubjectModal(subject)}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Batch Default Sub-Subjects
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between group-hover:border-primary group-hover:text-primary"
                        onClick={() => chooseSubjectForClasses(subject)}
                      >
                        Assign Classes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No main subjects found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create a new subject or adjust your search filter.</p>
              <Button onClick={() => openCreateModal("subject")} className="mt-4 gap-1">
                <Plus className="h-4 w-4" /> Create Main Subject
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Sub-Subjects */}
        <TabsContent value="sub-subjects" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sub-subjects..."
                className="pl-9"
              />
            </div>
            {mainSubjects.length > 0 && (
              <Select onValueChange={(subjId) => {
                const parent = mainSubjects.find((s) => s.id === subjId);
                if (parent) openBatchSubSubjectModal(parent);
              }}>
                <SelectTrigger className="w-56 text-xs h-10">
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder="Batch Generate For..." />
                </SelectTrigger>
                <SelectContent>
                  {mainSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => openCreateModal("subsubject")} variant="secondary" className="gap-1">
              <Plus className="h-4 w-4" /> New Sub-Subject
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" /> Loading sub-subjects...
            </div>
          ) : filteredSubSubjects.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSubSubjects.map((subject) => {
                const classCount = subject.classIds?.length || 0;
                return (
                  <Card key={subject.id} className="group relative flex flex-col justify-between transition hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {subject.parentSubject?.name || "Sub-Subject"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editSubject(subject)} title="Edit sub-subject">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setSubjectToDelete(subject)} title="Delete sub-subject">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-lg font-semibold">{subject.name}</CardTitle>
                      {subject.code && <CardDescription>Code: {subject.code}</CardDescription>}
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      <div className="flex flex-wrap gap-1.5">
                        {subject.departments && subject.departments.length > 0 ? (
                          subject.departments.map((dept) => (
                            <Badge key={dept.id} variant="secondary" className="text-xs font-normal">
                              {dept.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No departments assigned</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <span>Sub-Subject</span>
                        <span>{classCount} Classes</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between group-hover:border-primary group-hover:text-primary"
                        onClick={() => chooseSubjectForClasses(subject)}
                      >
                        Assign Classes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Layers className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No sub-subjects created yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sub-subjects allow you to create specialized versions of subjects (e.g. Mathematics JSS1).
              </p>
              <Button onClick={() => openCreateModal("subsubject")} className="mt-4 gap-1">
                <Plus className="h-4 w-4" /> Create Sub-Subject
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Offering Classes */}
        <TabsContent value="classes" className="space-y-4">
          {selectedSubject && (
            <Card>
              <CardHeader className="flex flex-col gap-2 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("main-subjects")} className="mb-2 h-7 gap-1 px-2 text-xs text-muted-foreground">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to subjects
                  </Button>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold">{selectedSubject.name}</CardTitle>
                    {selectedSubject.parentSubject && (
                      <Badge variant="outline">Sub-subject of {selectedSubject.parentSubject.name}</Badge>
                    )}
                  </div>
                  <CardDescription>Select all classes that offer this subject.</CardDescription>
                </div>
                <Badge variant="secondary" className="w-fit text-sm">
                  {selectedClassIds.length} Selected
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3 p-6">
                {classes.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {classes.map((schoolClass) => {
                      const checked = selectedClassIds.includes(schoolClass.id);
                      return (
                        <div
                          key={schoolClass.id}
                          onClick={() => toggleClass(schoolClass.id)}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                            checked ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/40"
                          }`}
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleClass(schoolClass.id)} />
                          <div className="min-w-0 flex-1">
                            <span className="block font-medium text-sm">{schoolClass.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {[schoolClass.level, schoolClass.year, schoolClass.department].filter(Boolean).join(" · ") || "General"}
                            </span>
                          </div>
                          {checked && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No classes available in school database.</p>
                )}

                <div className="flex flex-col-reverse justify-between gap-3 border-t pt-4 sm:flex-row">
                  <Button variant="ghost" onClick={() => setSelectedClassIds([])} size="sm">
                    Clear Selection
                  </Button>
                  <Button onClick={saveAssignments} disabled={saving} size="sm">
                    {saving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save Class Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Batch Default Sub-Subjects Modal */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Batch Default Sub-Subjects for {batchParentSubject?.name}
            </DialogTitle>
            <DialogDescription>
              Department-based levels generated for {batchParentSubject?.name}. All checkboxes are checked by default.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b pb-2 text-xs">
              <span className="font-medium text-muted-foreground">
                {batchCandidates.filter((c) => c.selected && !c.alreadyExists).length} of {batchCandidates.length} Selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => toggleAllCandidates(true)}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => toggleAllCandidates(false)}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
              {batchCandidates.map((candidate, idx) => (
                <div
                  key={candidate.name}
                  onClick={() => {
                    if (!candidate.alreadyExists) toggleCandidateSelection(idx);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                    candidate.alreadyExists
                      ? "opacity-50 bg-muted/40 border-dashed cursor-not-allowed"
                      : candidate.selected
                      ? "border-primary bg-primary/5 shadow-xs font-medium"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={candidate.selected || candidate.alreadyExists}
                      disabled={candidate.alreadyExists}
                      onCheckedChange={() => toggleCandidateSelection(idx)}
                    />
                    <div>
                      <span className="font-semibold text-sm">{candidate.name}</span>
                      {candidate.code && <span className="ml-2 text-muted-foreground">({candidate.code})</span>}
                    </div>
                  </div>

                  {candidate.alreadyExists ? (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Already Exists
                    </Badge>
                  ) : candidate.selected ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : null}
                </div>
              ))}
            </div>

            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setBatchModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleBatchCreateSubSubjects}
                disabled={batchCreating || batchCandidates.filter((c) => c.selected && !c.alreadyExists).length === 0}
              >
                {batchCreating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Create {batchCandidates.filter((c) => c.selected && !c.alreadyExists).length} Sub-Subjects
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) setEditingSubject(null); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubject ? `Edit ${editingSubject.name}` : "Create Subject"}</DialogTitle>
            <DialogDescription>
              {editingSubject ? "Modify subject settings or add sub-subjects directly under it." : "Add a main subject or sub-subject to your school curriculum."}
            </DialogDescription>
          </DialogHeader>

          {/* Mode 1: Creating a new subject */}
          {!editingSubject && (
            <Tabs value={dialogTab} onValueChange={(val) => setDialogTab(val as "subject" | "subsubject")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="subject">Main Subject</TabsTrigger>
                <TabsTrigger value="subsubject">Sub-Subject</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Mode 2: Editing a Main Subject (has 2 tabs: Edit Details vs Create Sub-Subject) */}
          {editingSubject && !editingSubject.parentSubjectId && (
            <Tabs value={editTab} onValueChange={(val) => setEditTab(val as "details" | "subsubjects")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Subject Details</TabsTrigger>
                <TabsTrigger value="subsubjects">Sub-Subjects ({editingSubSubjects.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="pt-2">
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectName">Subject Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="subjectName"
                      required
                      maxLength={80}
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g. Mathematics"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subjectCode">Subject Code <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input
                      id="subjectCode"
                      maxLength={20}
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                      placeholder="e.g. MTH"
                    />
                  </div>

                  {/* Department Multi-Select Checkboxes */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label>Departments <span className="font-normal text-muted-foreground">(Select multiple)</span></Label>
                      <DepartmentCreateButton compact onCreated={loadData} />
                    </div>

                    {departments.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2.5 rounded-lg border p-3 bg-muted/20">
                        {departments.map((dept) => {
                          const checked = selectedDepartmentIds.includes(dept.id);
                          return (
                            <label
                              key={dept.id}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-2.5 text-xs transition-colors ${
                                checked ? "border-primary bg-primary/10 font-medium text-primary" : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleDepartment(dept.id)}
                              />
                              <span className="truncate">{dept.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground space-y-2">
                        <p>No departments configured in school.</p>
                        <DepartmentCreateButton onCreated={loadData} />
                      </div>
                    )}
                  </div>

                  {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              {/* Sub-Subjects Tab inside Edit Dialog */}
              <TabsContent value="subsubjects" className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-sm font-semibold">Sub-Subjects for {editingSubject.name}</h4>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs gap-1 text-primary bg-primary/10 hover:bg-primary/20"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      openBatchSubSubjectModal(editingSubject);
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Batch Generate Defaults
                  </Button>
                </div>

                {/* List of existing sub-subjects for editingSubject */}
                <div className="space-y-2">
                  {editingSubSubjects.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {editingSubSubjects.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between rounded-lg border p-2.5 text-xs bg-muted/20">
                          <div>
                            <span className="font-medium">{sub.name}</span>
                            {sub.code && <span className="ml-2 text-muted-foreground">({sub.code})</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editSubject(sub)} title="Edit sub-subject">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setSubjectToDelete(sub)} title="Delete sub-subject">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground border border-dashed rounded-lg p-3 text-center">
                      No sub-subjects currently linked to {editingSubject.name}.
                    </p>
                  )}
                </div>

                {/* Create Sub-Subject Form inside Edit Dialog */}
                <form onSubmit={handleCreateInlineSubSubject} className="space-y-3 border-t pt-3">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-primary" /> Create New Sub-Subject under {editingSubject.name}
                  </h4>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="inlineSubName">Sub-Subject Name <span className="text-destructive">*</span></Label>
                      <div className="w-52">
                        <Select onValueChange={(val) => setNewInlineSubName(val)}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Name suggestions..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getCommonSubSubjectSuggestions(editingSubject.name).map((suggestion) => (
                              <SelectItem key={suggestion} value={suggestion} className="text-xs">
                                {suggestion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Input
                      id="inlineSubName"
                      required
                      maxLength={80}
                      value={newInlineSubName}
                      onChange={(e) => setNewInlineSubName(e.target.value)}
                      placeholder={`e.g. ${editingSubject.name} (JSS 1)`}
                    />

                    {/* Quick Preset Badges */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] font-medium text-muted-foreground mr-1">Presets:</span>
                      {["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"].map((lvl) => (
                        <Badge
                          key={lvl}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-[10px] py-0 px-1.5 font-normal transition-colors"
                          onClick={() => setNewInlineSubName(`${editingSubject.name} (${lvl})`)}
                        >
                          {lvl}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inlineSubCode">Sub-Subject Code <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input
                      id="inlineSubCode"
                      maxLength={20}
                      value={newInlineSubCode}
                      onChange={(e) => setNewInlineSubCode(e.target.value)}
                      placeholder="e.g. MTH-J1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Departments <span className="font-normal text-muted-foreground">(Select multiple)</span></Label>
                    {departments.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 rounded-lg border p-2.5 bg-muted/20">
                        {departments.map((dept) => {
                          const checked = newInlineSubDeptIds.includes(dept.id);
                          return (
                            <label key={dept.id} className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs ${checked ? "border-primary bg-primary/10 font-medium text-primary" : "border-border"}`}>
                              <Checkbox checked={checked} onCheckedChange={() => toggleInlineDepartment(dept.id)} />
                              <span className="truncate">{dept.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No departments available.</p>
                    )}
                  </div>

                  {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Close
                    </Button>
                    <Button type="submit" disabled={creatingInlineSub}>
                      {creatingInlineSub && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      Add Sub-Subject
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {/* Mode 3: Creation OR Editing a Sub-Subject directly */}
          {(!editingSubject || Boolean(editingSubject.parentSubjectId)) && (
            <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
              {(dialogTab === "subsubject" || Boolean(editingSubject?.parentSubjectId)) && (
                <div className="space-y-2">
                  <Label htmlFor="parentSubject">Parent Subject <span className="text-destructive">*</span></Label>
                  <Select value={selectedParentSubjectId} onValueChange={setSelectedParentSubjectId}>
                    <SelectTrigger id="parentSubject">
                      <SelectValue placeholder="Select parent subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mainSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="subjectName">
                    {dialogTab === "subsubject" || Boolean(editingSubject?.parentSubjectId) ? "Sub-Subject Name" : "Subject Name"} <span className="text-destructive">*</span>
                  </Label>
                  
                  {(dialogTab === "subsubject" || Boolean(editingSubject?.parentSubjectId)) && activeParentSubjectName && (
                    <div className="w-52">
                      <Select onValueChange={(val) => setNewSubjectName(val)}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Name suggestions..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getCommonSubSubjectSuggestions(activeParentSubjectName).map((suggestion) => (
                            <SelectItem key={suggestion} value={suggestion} className="text-xs">
                              {suggestion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Input
                  id="subjectName"
                  required
                  maxLength={80}
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder={dialogTab === "subsubject" || Boolean(editingSubject?.parentSubjectId) ? "e.g. Mathematics (JSS 1)" : "e.g. Mathematics"}
                />

                {(dialogTab === "subsubject" || Boolean(editingSubject?.parentSubjectId)) && activeParentSubjectName && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] font-medium text-muted-foreground mr-1">Presets:</span>
                    {["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"].map((lvl) => (
                      <Badge
                        key={lvl}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-[10px] py-0 px-1.5 font-normal transition-colors"
                        onClick={() => setNewSubjectName(`${activeParentSubjectName} (${lvl})`)}
                      >
                        {lvl}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectCode">Subject Code <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input
                  id="subjectCode"
                  maxLength={20}
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  placeholder="e.g. MTH"
                />
              </div>

              {/* Department Multi-Select Checkboxes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label>Departments <span className="font-normal text-muted-foreground">(Select multiple)</span></Label>
                  <DepartmentCreateButton compact onCreated={loadData} />
                </div>

                {departments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5 rounded-lg border p-3 bg-muted/20">
                    {departments.map((dept) => {
                      const checked = selectedDepartmentIds.includes(dept.id);
                      return (
                        <label
                          key={dept.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-2.5 text-xs transition-colors ${
                            checked ? "border-primary bg-primary/10 font-medium text-primary" : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleDepartment(dept.id)}
                          />
                          <span className="truncate">{dept.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground space-y-2">
                    <p>No departments configured in school.</p>
                    <DepartmentCreateButton onCreated={loadData} />
                  </div>
                )}
              </div>

              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSubject ? "Save Changes" : dialogTab === "subsubject" ? "Create Sub-Subject" : "Create Subject"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={Boolean(subjectToDelete)} onOpenChange={(open) => { if (!open && !deleting) setSubjectToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {subjectToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove class offerings for this subject. Associated questions and topics will remain preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); void deleteSubject(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
