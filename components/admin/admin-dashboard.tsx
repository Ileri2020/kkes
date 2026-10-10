"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  PlusCircle,
  Copy,
  CheckCircle2,
  Sparkles,
  School,
  Users,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  X,
  Layers,
} from "lucide-react";

type AcademicSession = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  terms: { id: string; name: string; status: string }[];
  _count?: { classes: number };
};

export function AdminDashboardContent() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form states
  const [sessionName, setSessionName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copyClasses, setCopyClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const fetchSessions = () => {
    fetch("/api/admin/start-session")
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const activeSession = sessions.find((s) => s.isCurrent) || sessions[0];

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName,
          startDate,
          endDate,
          copyPreviousClasses: copyClasses,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ success: true, message: data.message });
        setSessionName("");
        fetchSessions();
        setTimeout(() => {
          setDialogOpen(false);
          setFeedback(null);
        }, 3000);
      } else {
        setFeedback({ success: false, message: data.error || "Failed to start session" });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action to Start New Academic Year Session */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              <Sparkles size={16} />
              <span>Admin Portal Management</span>
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Academic Session & School Operations
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Active Session:{" "}
              <strong className="text-emerald-400 font-bold">
                {activeSession ? activeSession.name : "2023/2024"}
              </strong>{" "}
              • Manage yearly sessions, carry over classes, and configure terms.
            </p>
          </div>

          {/* Start New Academic Session Button */}
          <div>
            <button
              onClick={() => setDialogOpen(true)}
              className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle size={20} />
              <span>Start New Academic Session</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Sessions Grid */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Active Session Status Widget */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-indigo-600">
              <Calendar size={20} />
              <h3 className="font-bold text-slate-900">Current Session Status</h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Active
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-slate-400">Session Name</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {activeSession?.name || "2023/2024"}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Terms: {activeSession?.terms?.length || 3} Terms</span>
              <span>Classes: {activeSession?._count?.classes || 0} Classes</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sky-600 border-b border-slate-100 pb-3">
            <School size={20} />
            <h3 className="font-bold text-slate-900">Class & Department Control</h3>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Per-year unique class objects. Clones carried over from previous session stay intact for historical reference.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="/admin/classes"
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              View Classes
            </a>
            <a
              href="/admin/subjects"
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              View Subjects
            </a>
          </div>
        </div>

        {/* Session History */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 border-b border-slate-100 pb-3">
            <Layers size={20} />
            <h3 className="font-bold text-slate-900">Recorded Sessions</h3>
          </div>
          <div className="mt-4 space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs">
                <span className="font-semibold text-slate-800">{s.name}</span>
                {s.isCurrent ? (
                  <span className="font-bold text-emerald-600">Current Active</span>
                ) : (
                  <span className="text-slate-400">Archived Ref</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Start New Academic Session Modal Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md">
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Start New Academic Session</h3>
                  <p className="text-xs text-slate-500">Initialize school session & carry over classes</p>
                </div>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {feedback && (
              <div
                className={`mt-4 rounded-xl p-4 text-xs font-semibold ${
                  feedback.success
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleStartSession} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  New Academic Session Name:
                </label>
                <input
                  type="text"
                  required
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. 2024/2025"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Carry Over Classes Checkbox */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={copyClasses}
                    onChange={(e) => setCopyClasses(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900">
                      Carry over classes & subject offerings from current session
                    </span>
                    <p className="mt-1 text-xs text-slate-600">
                      Creates new unique class objects for the new session with preserved departments and subject offerings, while leaving historical session data intact in DB.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Launching..." : "Launch New Academic Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
