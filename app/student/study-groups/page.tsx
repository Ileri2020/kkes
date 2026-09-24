"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { StudentLayout, StudentSection, StudentEmpty } from "@/components/student/student-layout";
import { useStudentModel } from "@/hooks/use-student-model";

export default function StudentStudyGroups() {
  const { data, loading, error } = useStudentModel<any>("studyGroup", "limit=50");
  const [busy, setBusy] = useState<string | null>(null);
  async function toggle(group: any) { const membership = group.members?.[0]; setBusy(group.id); await fetch(`/api/dbhandler?model=studyGroupMember${membership ? `&id=${membership.id}` : ""}`, membership ? { method: "DELETE" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId: group.id }) }); window.location.reload(); }
  return <StudentLayout title="Study groups"><StudentSection eyebrow="Community learning" title="Study groups" description="Study with classmates in groups permitted by your school."><div className="flex gap-2"><button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">My groups</button><button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">Discover groups</button></div>{loading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-200"/> : error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Study groups could not be loaded.</p> : data.length ? <div className="grid gap-4 sm:grid-cols-2">{data.map((group) => <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Users className="text-emerald-600"/><h3 className="mt-6 font-bold text-[#102a43]">{group.name}</h3><p className="mt-2 text-sm text-slate-500">{group.description ?? "School study group"}</p><div className="mt-5 flex items-center justify-between text-xs text-slate-400"><span>{group.members?.length ?? 0} membership record</span><button disabled={busy === group.id} onClick={() => toggle(group)} className="rounded-lg bg-[#102a43] px-3 py-2 font-semibold text-white">{busy === group.id ? "Saving..." : group.members?.[0] ? "Leave" : "Join"}</button></div></article>)}</div> : <StudentEmpty title="No study groups available" message="Permitted groups will appear with their subject, access type, members, and activity."/>}</StudentSection></StudentLayout>;
}
