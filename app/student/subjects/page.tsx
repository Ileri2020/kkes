"use client";

import { useEffect, useState, useMemo } from "react";
import {
  GraduationCap,
  Search,
  CheckCircle2,
  BookOpen,
  PlusCircle,
  School,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  Info,
} from "lucide-react";
import { StudentLayout, StudentSection } from "@/components/student/student-layout";
import { useAppContext } from "@/hooks/useAppContext";

type ClassItem = {
  id: string;
  name: string;
  level: string;
  department: string;
  year: string;
};

type SubjectItem = {
  id: string;
  name: string;
  parentSubjectId?: string | null;
  parentSubject?: { id: string; name: string } | null;
  subSubjects?: SubjectItem[];
  departmentIds?: string[];
};

export default function StudentSubjectsPage() {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);
  const [classOfferings, setClassOfferings] = useState<SubjectItem[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  
  // Selected class sub-subject IDs
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  
  // Borrowed sub-subject IDs
  const [borrowedSubjectIds, setBorrowedSubjectIds] = useState<string[]>([]);
  
  // Borrow search filter & pagination
  const [borrowSearch, setBorrowSearch] = useState("");
  const [borrowPage, setBorrowPage] = useState(1);
  const ROWS_PER_PAGE = 5;

  // Accordion open states for parent subjects
  const [openParents, setOpenParents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/student/subjects-enrollment")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setStudentId(data.studentId);
        setSelectedClassId(data.classId || "");
        setCurrentClass(data.currentClass);
        setAvailableClasses(data.availableClasses || []);
        setClassOfferings(data.classOfferings || []);
        setAllSubjects(data.allSubjects || []);

        // Pre-populate enrollments
        if (data.enrollments && Array.isArray(data.enrollments)) {
          const classEnrolled: string[] = [];
          const borrowedEnrolled: string[] = [];

          data.enrollments.forEach((e: any) => {
            if (e.isBorrowed) {
              borrowedEnrolled.push(e.subjectId);
            } else {
              classEnrolled.push(e.subjectId);
            }
          });

          setSelectedSubjectIds(classEnrolled);
          setBorrowedSubjectIds(borrowedEnrolled);
        } else if (data.classOfferings) {
          // Default all offered subjects as selected
          const defaultIds = data.classOfferings.map((s: any) => s.id);
          setSelectedSubjectIds(defaultIds);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // When student changes class dropdown — fetch offerings only for the new class
  const handleClassChange = async (newClassId: string) => {
    setSelectedClassId(newClassId);
    const cls = availableClasses.find((c) => c.id === newClassId);
    if (cls) setCurrentClass(cls);

    if (!newClassId) {
      setClassOfferings([]);
      setSelectedSubjectIds([]);
      return;
    }

    try {
      const res = await fetch(`/api/student/class-offerings?classId=${newClassId}`);
      const data = await res.json();
      if (data.classOfferings) {
        setClassOfferings(data.classOfferings);
        // Pre-select all offerings of newly selected class
        setSelectedSubjectIds(data.classOfferings.map((s: any) => s.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleClassSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleBorrowedSubject = (id: string) => {
    setBorrowedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Group class offerings by parent subject
  const groupedClassOfferings = useMemo(() => {
    const map: Record<string, { parentName: string; subSubjects: SubjectItem[] }> = {};
    classOfferings.forEach((subj) => {
      const parentName = subj.parentSubject?.name || subj.name;
      if (!map[parentName]) {
        map[parentName] = { parentName, subSubjects: [] };
      }
      map[parentName].subSubjects.push(subj);
    });
    return Object.values(map);
  }, [classOfferings]);

  // Available subjects for borrowing (excluding class offerings)
  const borrowableSubjects = useMemo(() => {
    const classOfferIds = new Set(classOfferings.map((s) => s.id));
    return allSubjects
      .filter((s) => !classOfferIds.has(s.id))
      .filter((s) => {
        if (!borrowSearch.trim()) return true;
        const q = borrowSearch.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.parentSubject?.name && s.parentSubject.name.toLowerCase().includes(q))
        );
      });
  }, [allSubjects, classOfferings, borrowSearch]);

  // Paginated borrow table (max 5 rows)
  const paginatedBorrow = useMemo(() => {
    const start = (borrowPage - 1) * ROWS_PER_PAGE;
    return borrowableSubjects.slice(start, start + ROWS_PER_PAGE);
  }, [borrowableSubjects, borrowPage]);

  const totalBorrowPages = Math.ceil(borrowableSubjects.length / ROWS_PER_PAGE) || 1;

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/student/subjects-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          classId: selectedClassId,
          selectedSubjectIds,
          borrowedSubjectIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="My Subjects">
        <div className="space-y-6">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="My Subjects">
      <StudentSection
        eyebrow="Running Academic Session Curriculum"
        title="Subject Selection & Borrowing"
        description="Review your registered class, select offered subjects, and borrow additional sub-subjects for this session."
      >
        <div className="space-y-8 pb-24">
          {/* Class Selection Banner */}
          <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                  <School size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    Active Registered Class
                  </p>
                  <h3 className="text-xl font-bold text-slate-900">
                    {currentClass ? currentClass.name : "No Class Assigned Yet"}
                  </h3>
                  {currentClass && (
                    <p className="text-xs text-slate-500">
                      Department: <strong className="text-indigo-700">{currentClass.department || "General"}</strong> • Session: {currentClass.year || "Current"}
                    </p>
                  )}
                </div>
              </div>

              {/* Class Selection Dropdown */}
              <div className="min-w-[240px]">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select / Switch Class:
                </label>
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-indigo-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Choose your class from DB --</option>
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.department || "General"}) - {cls.year || "Current"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 1: Subjects Offered by Selected Class */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Sub-subjects Offered by Your Class</h3>
                  <p className="text-xs text-slate-500">
                    Check all sub-subjects you are taking for your registered class.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {selectedSubjectIds.length} Selected
              </span>
            </div>

            {classOfferings.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <Info className="mx-auto text-slate-400" size={32} />
                <p className="mt-2 text-sm font-semibold text-slate-700">No specific class sub-subjects assigned yet.</p>
                <p className="text-xs text-slate-500">You can select a different class above or borrow sub-subjects below.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {groupedClassOfferings.map((group) => {
                  const isOpen = openParents[group.parentName] ?? true;
                  return (
                    <div key={group.parentName} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
                      {/* Parent Subject Accordion Header */}
                      <button
                        onClick={() =>
                          setOpenParents((prev) => ({ ...prev, [group.parentName]: !isOpen }))
                        }
                        className="flex w-full items-center justify-between bg-slate-100/80 px-4 py-3 text-left font-bold text-slate-800 transition hover:bg-slate-200/60"
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="text-indigo-600" size={18} />
                          <span>{group.parentName}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                            {group.subSubjects.length} sub-subject(s)
                          </span>
                        </div>
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      {/* Sub-subjects rows */}
                      {isOpen && (
                        <div className="divide-y divide-slate-100 bg-white">
                          {group.subSubjects.map((sub) => {
                            const isChecked = selectedSubjectIds.includes(sub.id);
                            return (
                              <label
                                key={sub.id}
                                className="flex cursor-pointer items-center justify-between px-5 py-3 bg-foreground/5 transition hover:bg-indigo-50/60"
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleClassSubject(sub.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-sm font-semibold text-slate-800">{sub.name}</span>
                                </div>
                                {isChecked && (
                                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                    <CheckCircle2 size={14} /> Enrolled
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Borrow Sub-subjects (Max 5 Rows Table + Search) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Borrow Additional Sub-subjects</h3>
                  <p className="text-xs text-slate-500">
                    Search and pick sub-subjects outside your class to take for this session.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                {borrowedSubjectIds.length} Borrowed
              </span>
            </div>

            {/* Search Input Filter */}
            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  value={borrowSearch}
                  onChange={(e) => {
                    setBorrowSearch(e.target.value);
                    setBorrowPage(1);
                  }}
                  placeholder="Search sub-subject by name or parent subject..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Borrow Table (Max 5 rows per view) */}
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Select</th>
                    <th className="px-4 py-3">Sub-subject Name</th>
                    <th className="px-4 py-3">Parent Subject</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedBorrow.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-xs text-slate-500">
                        No additional borrowable sub-subjects found.
                      </td>
                    </tr>
                  ) : (
                    paginatedBorrow.map((sub) => {
                      const isBorrowed = borrowedSubjectIds.includes(sub.id);
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isBorrowed}
                              onChange={() => toggleBorrowedSubject(sub.id)}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{sub.name}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {sub.parentSubject?.name || "General"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => toggleBorrowedSubject(sub.id)}
                              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                isBorrowed
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                              }`}
                            >
                              {isBorrowed ? "Borrowed" : "+ Borrow"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalBorrowPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {paginatedBorrow.length} of {borrowableSubjects.length} items (Page {borrowPage} of {totalBorrowPages})
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={borrowPage === 1}
                    onClick={() => setBorrowPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={borrowPage >= totalBorrowPages}
                    onClick={() => setBorrowPage((p) => Math.min(totalBorrowPages, p + 1))}
                    className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Fixed Bottom-Right Apply / Save Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-3 rounded-2xl px-6 py-4 font-bold text-white shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${
              saveSuccess
                ? "bg-emerald-600 shadow-emerald-600/30"
                : "bg-gradient-to-r from-indigo-600 to-sky-600 shadow-indigo-600/40 hover:from-indigo-500 hover:to-sky-500"
            }`}
          >
            {saveSuccess ? (
              <>
                <Check size={20} className="animate-bounce" />
                <span>Changes Applied & Saved!</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>{saving ? "Saving..." : "Apply & Save Subject Changes"}</span>
              </>
            )}
          </button>
        </div>
      </StudentSection>
    </StudentLayout>
  );
}
