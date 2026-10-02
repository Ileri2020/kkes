"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, CheckCircle2, Clock3, Flame, Gauge, Target, Trophy } from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";
import { StudentEmpty } from "@/components/student/student-layout";

type DashboardData = Record<string, any[]>;

async function readModel(model: string) {
  const response = await fetch(`/api/dbhandler?model=${model}&limit=12`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${model}`);
  const data = await response.json();
  return [model, Array.isArray(data) ? data : data ? [data] : []] as const;
}

export function DashboardContent() {
  const { user } = useAppContext();
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const firstName = user?.name?.split(" ")[0] || "Student";

  useEffect(() => {
    if (!user?.id || user.id === "nil") return;
    Promise.all(["dailyProgress", "performanceMetric", "test", "assignment", "announcement", "subject", "assessmentAttempt"].map(readModel))
      .then((entries) => setData(Object.fromEntries(entries)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <DashboardLoading />;
  if (error) return <section className="rounded-2xl border border-red-200 bg-red-50 p-8"><h2 className="font-bold text-red-800">Dashboard unavailable</h2><p className="mt-2 text-sm text-red-700">We could not load your learning data.</p><button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white">Try again</button></section>;

  const progress = data.dailyProgress?.[0];
  const metrics = [
    ["Questions today", progress ? String(progress.solvedToday) : "--", progress ? "Recorded today" : "No activity yet", CheckCircle2],
    ["Accuracy", progress ? `${Math.round(progress.accuracy)}%` : "--", progress ? "Based on your activity" : "Complete questions to measure accuracy", Target],
    ["Current streak", progress ? `${progress.streak} days` : "--", progress ? "Keep returning daily" : "No streak recorded", Flame],
    ["Speed index", "--", "Available after timed attempts", Gauge],
  ] as const;

  return <div className="space-y-6"><section className="rounded-2xl bg-primary p-7 text-foreground"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p><h2 className="mt-3 text-3xl font-bold">Good morning, {firstName}</h2><p className="mt-2 text-sm text-slate-300">Continue your learning journey.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/student/questions/random" className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-foreground">Continue practice</Link><Link href="/student/results" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">View results</Link></div></section><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, note, Icon]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="text-sky-600" size={20}/><p className="mt-5 text-xs text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-[#102a43]">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></div>)}</section><div className="grid gap-6 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h3 className="font-bold text-[#102a43]">Subject performance</h3><BarChart3 className="text-sky-600" size={20}/></div>{data.performanceMetric?.length ? <div className="mt-6 grid gap-4">{data.performanceMetric.slice(0, 5).map((metric) => <div key={metric.id}><div className="flex justify-between text-sm"><span>{metric.subject}</span><strong>{Math.round(metric.score)}%</strong></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(metric.score, 100)}%` }}/></div></div>)}</div> : <StudentEmpty title="No subject activity" message="Performance appears after your first recorded learning activity." href="/student/subjects" action="View subjects"/>}</section><section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold text-[#102a43]">Upcoming tests</h3>{data.test?.length ? <div className="mt-4 grid gap-3">{data.test.slice(0, 3).map((test) => <Link key={test.id} href={`/student/tests/${test.id}`} className="flex items-center justify-between rounded-xl bg-orange-50 p-4"><div><p className="font-semibold text-slate-700">{test.title}</p><p className="mt-1 text-xs text-slate-500">{test.durationMinutes ?? "No fixed duration"} minutes</p></div><Clock3 className="text-orange-600" size={18}/></Link>)}</div> : <StudentEmpty title="No upcoming tests" message="Scheduled tests will appear here." href="/student/tests" action="Open tests"/>}</section></div><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold text-[#102a43]">Pending assignments</h3>{data.assignment?.length ? <div className="mt-4 grid gap-3">{data.assignment.slice(0, 3).map((item) => <Link key={item.id} href={`/student/assignments/${item.id}`} className="flex items-center gap-3 rounded-xl bg-sky-50 p-4"><BookOpen className="text-sky-600" size={18}/><span className="text-sm font-semibold text-slate-700">{item.title}</span></Link>)}</div> : <StudentEmpty title="No assignments" message="You have no pending assignments." href="/student/assignments" action="Open assignments"/>}</section><section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold text-[#102a43]">Recent results</h3>{data.assessmentAttempt?.length ? <div className="mt-4 grid gap-3">{data.assessmentAttempt.slice(0, 3).map((attempt) => <Link key={attempt.id} href="/student/results" className="flex items-center justify-between rounded-xl border border-slate-100 p-4"><span className="text-sm font-semibold text-slate-700">{attempt.test?.title ?? "Assessment"}</span><span className="text-xs text-slate-500">{attempt.status}</span></Link>)}</div> : <StudentEmpty title="No results yet" message="Complete a test or quiz to build your history." href="/student/quizzes" action="Browse quizzes"/>}</section></div><section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><Trophy className="text-amber-500"/><h3 className="font-bold text-[#102a43]">Ranking and announcements</h3></div>{data.announcement?.length ? <div className="mt-4 grid gap-3">{data.announcement.slice(0, 3).map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold text-slate-700">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.body}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No announcements or ranking data available yet.</p>}</section></div>;
}

function DashboardLoading() { return <div className="grid gap-6"><div className="h-44 animate-pulse rounded-2xl bg-slate-200"/><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200"/>)}</div><div className="grid gap-6 lg:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl bg-slate-200"/><div className="h-64 animate-pulse rounded-2xl bg-slate-200"/></div></div>; }
