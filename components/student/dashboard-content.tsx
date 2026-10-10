"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  Target,
  Trophy,
  GraduationCap,
  Calendar,
  School,
  Layers,
  FileText,
  Award,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";
import { StudentEmpty } from "@/components/student/student-layout";

type DashboardData = Record<string, any[]>;

type StudentInfo = {
  studentName: string;
  studentEmail: string;
  set: {
    id: string | null;
    name: string;
    entryYear: number;
    expectedGraduationYear: number;
    yearsSpan: string;
    currentLevel: string;
    status: string;
  };
  registeredClass: {
    id: string | null;
    name: string;
    level: string;
    year: string;
    department: string;
  };
  entryDetails: {
    entryLevel: string;
    entryYear: number;
  };
};

async function readModel(model: string) {
  const response = await fetch(`/api/dbhandler?model=${model}&limit=12`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${model}`);
  const data = await response.json();
  return [model, Array.isArray(data) ? data : data ? [data] : []] as const;
}

export function DashboardContent() {
  const { user } = useAppContext();
  const [data, setData] = useState<DashboardData>({});
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Always fetch student profile (supports dev mode when user is null/nil)
    const userId = user?.id && user.id !== "nil" ? user.id : "";
    
    Promise.all([
      fetch(`/api/student/dashboard-info?userId=${userId}`).then((res) => res.json()),
      ...["dailyProgress", "performanceMetric", "test", "assignment", "announcement", "subject", "assessmentAttempt"].map(readModel),
    ])
      .then(([info, ...entries]) => {
        if (info && !info.error) setStudentInfo(info);
        setData(Object.fromEntries(entries));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <DashboardLoading />;
  if (error)
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="font-bold text-red-800">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-red-700">We could not load your learning data.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </section>
    );

  const firstName = studentInfo?.studentName?.split(" ")[0] || user?.name?.split(" ")[0] || "Student";
  const progress = data.dailyProgress?.[0];
  const metrics = [
    ["Questions today", progress ? String(progress.solvedToday) : "--", progress ? "Recorded today" : "No activity yet", CheckCircle2],
    ["Accuracy", progress ? `${Math.round(progress.accuracy)}%` : "--", progress ? "Based on your activity" : "Complete questions to measure accuracy", Target],
    ["Current streak", progress ? `${progress.streak} days` : "--", progress ? "Keep returning daily" : "No streak recorded", Flame],
    ["Speed index", "--", "Available after timed attempts", Gauge],
  ] as const;

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, {firstName}! 👋
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Track your academic cohort, current registered class, and quick learning tools.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/student/assignments"
              className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-500 hover:shadow-indigo-500/20"
            >
              <FileText size={18} />
              <span>Assignments</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/student/results"
              className="group flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-500 hover:shadow-emerald-500/20"
            >
              <Award size={18} />
              <span>Results</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/student/past-questions"
              className="group flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-md transition-all hover:bg-amber-400 hover:shadow-amber-500/20"
            >
              <HelpCircle size={18} />
              <span>Past Questions</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Logged-In Student Set & Academic Profile Card */}
      {studentInfo && (
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-indigo-100/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Student Academic Profile & Cohort</h3>
                <p className="text-xs text-slate-500">Live records from database schema</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Active Enrolled
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Student Set Name */}
            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600">
                <GraduationCap size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Student Set</span>
              </div>
              <p className="mt-2 text-lg font-extrabold text-slate-900">
                {studentInfo.set?.name || "Achievers Set"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Graduating Cohort</p>
            </div>

            {/* Set Duration (Years) */}
            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-amber-600">
                <Calendar size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Set Duration</span>
              </div>
              <p className="mt-2 text-lg font-extrabold text-slate-900">
                {studentInfo.set?.yearsSpan || "2014 – 2020"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Start ({studentInfo.set?.entryYear}) to End ({studentInfo.set?.expectedGraduationYear})
              </p>
            </div>

            {/* Registered Class for This Year */}
            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-sky-600">
                <School size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered Class</span>
              </div>
              <p className="mt-2 text-lg font-extrabold text-slate-900">
                {studentInfo.registeredClass?.name || "SS 1 B"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Session {studentInfo.registeredClass?.year || "2023/2024"}
              </p>
            </div>

            {/* Class Department */}
            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-purple-600">
                <Layers size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Department</span>
              </div>
              <p className="mt-2 text-lg font-extrabold text-slate-900">
                {studentInfo.registeredClass?.department || "Science"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Joined at {studentInfo.entryDetails?.entryLevel} ({studentInfo.entryDetails?.entryYear})
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Metrics Row */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, note, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="text-indigo-600" size={20} />
            <p className="mt-5 text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-[#102a43]">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </section>

      {/* Subject Performance & Upcoming Tests */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#102a43]">Subject performance</h3>
            <BarChart3 className="text-indigo-600" size={20} />
          </div>
          {data.performanceMetric?.length ? (
            <div className="mt-6 grid gap-4">
              {data.performanceMetric.slice(0, 5).map((metric) => (
                <div key={metric.id}>
                  <div className="flex justify-between text-sm">
                    <span>{metric.subject}</span>
                    <strong>{Math.round(metric.score)}%</strong>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(metric.score, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StudentEmpty
              title="No subject activity"
              message="Performance appears after your first recorded learning activity."
              href="/student/subjects"
              action="View subjects"
            />
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-[#102a43]">Upcoming tests</h3>
          {data.test?.length ? (
            <div className="mt-4 grid gap-3">
              {data.test.slice(0, 3).map((test) => (
                <Link
                  key={test.id}
                  href={`/student/tests/${test.id}`}
                  className="flex items-center justify-between rounded-xl bg-orange-50 p-4 transition-colors hover:bg-orange-100/70"
                >
                  <div>
                    <p className="font-semibold text-slate-700">{test.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {test.durationMinutes ?? "No fixed duration"} minutes
                    </p>
                  </div>
                  <Clock3 className="text-orange-600" size={18} />
                </Link>
              ))}
            </div>
          ) : (
            <StudentEmpty
              title="No upcoming tests"
              message="Scheduled tests will appear here."
              href="/student/tests"
              action="Open tests"
            />
          )}
        </section>
      </div>

      {/* Pending Assignments & Recent Results */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#102a43]">Pending assignments</h3>
            <Link href="/student/assignments" className="text-xs font-semibold text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {data.assignment?.length ? (
            <div className="mt-4 grid gap-3">
              {data.assignment.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/student/assignments/${item.id}`}
                  className="flex items-center gap-3 rounded-xl bg-sky-50 p-4 transition-colors hover:bg-sky-100/70"
                >
                  <BookOpen className="text-sky-600" size={18} />
                  <span className="text-sm font-semibold text-slate-700">{item.title}</span>
                </Link>
              ))}
            </div>
          ) : (
            <StudentEmpty
              title="No assignments"
              message="You have no pending assignments."
              href="/student/assignments"
              action="Open assignments"
            />
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#102a43]">Recent results</h3>
            <Link href="/student/results" className="text-xs font-semibold text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {data.assessmentAttempt?.length ? (
            <div className="mt-4 grid gap-3">
              {data.assessmentAttempt.slice(0, 3).map((attempt) => (
                <Link
                  key={attempt.id}
                  href="/student/results"
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50"
                >
                  <span className="text-sm font-semibold text-slate-700">
                    {attempt.test?.title ?? "Assessment"}
                  </span>
                  <span className="text-xs text-slate-500">{attempt.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <StudentEmpty
              title="No results yet"
              message="Complete a test or quiz to build your history."
              href="/student/quizzes"
              action="Browse quizzes"
            />
          )}
        </section>
      </div>

      {/* Announcements */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <Trophy className="text-amber-500" />
          <h3 className="font-bold text-[#102a43]">Ranking and announcements</h3>
        </div>
        {data.announcement?.length ? (
          <div className="mt-4 grid gap-3">
            {data.announcement.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-700">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No announcements or ranking data available yet.</p>
        )}
      </section>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="grid gap-6">
      <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
