"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Coverage = {
  id: string;
  week: number;
  topic: string;
  subtopic: string | null;
  covered: boolean;
  description: string | null;
};

type RecommendedTopic = { topic: string | null; subtopics: string[] };
type SubjectInfo = { id: string; name: string; code: string | null; parentSubject: { id: string; name: string } | null };
type Draft = { week: string; topic: string; subtopic: string; description: string; customTopic: boolean; customSubtopic: boolean };

const CUSTOM = "__custom__";
const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.error === "string" ? body.error : "Something went wrong. Please try again.";
}

function newDraft(week = 1): Draft {
  return { week: String(week), topic: "", subtopic: "", description: "", customTopic: false, customSubtopic: false };
}

export function TopicCoverageDetail({ subjectId }: { subjectId: string }) {
  const [subject, setSubject] = useState<SubjectInfo | null>(null);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [recommendedTopics, setRecommendedTopics] = useState<RecommendedTopic[]>([]);
  const [customTopicIds, setCustomTopicIds] = useState<Set<string>>(new Set());
  const [customSubtopicIds, setCustomSubtopicIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Draft>(newDraft());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const topics = useMemo(() => [...new Set(recommendedTopics.flatMap((item) => item.topic ? [item.topic] : []))], [recommendedTopics]);
  const subtopics = useMemo(() => [...new Set(recommendedTopics.flatMap((item) => item.subtopics))].sort((a, b) => a.localeCompare(b)), [recommendedTopics]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/topic-coverage/${subjectId}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      setSubject(data.subject);
      setCoverages(data.coverages ?? []);
      setRecommendedTopics(data.recommendedTopics ?? []);
      const maxWeek = Math.max(0, ...(data.coverages ?? []).map((item: Coverage) => item.week));
      setDraft(newDraft(Math.min(maxWeek + 1, 52)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load topic coverage.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [subjectId]);

  function updateCoverage(id: string, patch: Partial<Coverage>) {
    setCoverages((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function saveCoverage(coverage: Coverage) {
    setSavingId(coverage.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/teacher/topic-coverage/${subjectId}/${coverage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week: Number(coverage.week),
          topic: coverage.topic,
          subtopic: coverage.subtopic,
          description: coverage.description,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setNotice(`Week ${coverage.week} saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this week.");
    } finally {
      setSavingId(null);
    }
  }

  async function setCovered(coverage: Coverage, checked: boolean) {
    updateCoverage(coverage.id, { covered: checked });
    setError("");
    try {
      const response = await fetch(`/api/teacher/topic-coverage/${subjectId}/${coverage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ covered: checked }),
      });
      if (!response.ok) throw new Error(await responseError(response));
    } catch (err) {
      updateCoverage(coverage.id, { covered: coverage.covered });
      setError(err instanceof Error ? err.message : "Unable to update covered status.");
    }
  }

  async function addCoverage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/teacher/topic-coverage/${subjectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week: Number(draft.week),
          topic: draft.topic,
          subtopic: draft.subtopic,
          description: draft.description,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      await load();
      setNotice("Topic coverage added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add topic coverage.");
    } finally {
      setAdding(false);
    }
  }

  async function deleteCoverage(coverage: Coverage) {
    if (!window.confirm(`Delete the coverage plan for week ${coverage.week}?`)) return;
    setDeletingId(coverage.id);
    setError("");
    try {
      const response = await fetch(`/api/teacher/topic-coverage/${subjectId}/${coverage.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response));
      setCoverages((current) => current.filter((item) => item.id !== coverage.id));
      setNotice(`Week ${coverage.week} deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete this week.");
    } finally {
      setDeletingId(null);
    }
  }

  function renderTopicFields(value: string, custom: boolean, onChange: (value: string) => void, onCustom: (custom: boolean) => void) {
    return (
      <div className="space-y-2">
        <select className={inputClass} value={custom ? CUSTOM : value} onChange={(event) => {
          if (event.target.value === CUSTOM) onCustom(true);
          else { onCustom(false); onChange(event.target.value); }
        }} aria-label="Topic">
          <option value="">Select a recommended topic</option>
          {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
          <option value={CUSTOM}>Write a different topic…</option>
        </select>
        {custom && <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} maxLength={200} placeholder="Enter your topic" aria-label="Custom topic" />}
      </div>
    );
  }

  function renderSubtopicFields(value: string, custom: boolean, onChange: (value: string) => void, onCustom: (custom: boolean) => void) {
    return (
      <div className="space-y-2">
        <select className={inputClass} value={custom ? CUSTOM : value} onChange={(event) => {
          if (event.target.value === CUSTOM) onCustom(true);
          else { onCustom(false); onChange(event.target.value); }
        }} aria-label="Subtopic">
          <option value="">Select a recommended subtopic</option>
          {subtopics.map((subtopic) => <option key={subtopic} value={subtopic}>{subtopic}</option>)}
          <option value={CUSTOM}>Write a different subtopic…</option>
        </select>
        {custom && <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} maxLength={300} placeholder="Enter your subtopic" aria-label="Custom subtopic" />}
      </div>
    );
  }

  if (loading) return <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading topic coverage…</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href="/teacher/topic-coverage" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All subjects
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{subject?.name ?? "Topic coverage"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {subject?.parentSubject?.name ? `${subject.parentSubject.name} · ` : ""}Plan topics by week, then mark each week covered when teaching is complete.
          </p>
        </div>
      </div>

      {error && <div role="alert" className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      {notice && !error && <div role="status" className="flex items-center gap-2 border border-emerald-600/20 bg-emerald-600/5 px-4 py-3 text-sm text-emerald-700"><Check className="h-4 w-4" />{notice}</div>}

      <section className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5">
        <div>
          <h2 className="font-semibold">Add a week</h2>
          <p className="text-sm text-muted-foreground">Choose from the JAMB topic list or enter your own topic and subtopic.</p>
        </div>
        <form onSubmit={addCoverage} className="grid gap-3 lg:grid-cols-[100px_minmax(180px,1fr)_minmax(220px,1.2fr)_minmax(160px,1fr)_auto] lg:items-end">
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Week
            <input className={inputClass} type="number" min={1} max={52} required value={draft.week} onChange={(event) => setDraft({ ...draft, week: event.target.value })} />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Topic
            {renderTopicFields(draft.topic, draft.customTopic, (topic) => setDraft({ ...draft, topic }), (customTopic) => setDraft({ ...draft, customTopic }))}
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Subtopic
            {renderSubtopicFields(draft.subtopic, draft.customSubtopic, (subtopic) => setDraft({ ...draft, subtopic }), (customSubtopic) => setDraft({ ...draft, customSubtopic }))}
          </label>
          <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Description (optional)
            <input className={inputClass} maxLength={500} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Notes or learning objective" />
          </label>
          <button type="submit" disabled={adding} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            {adding ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-foreground/5 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-semibold">Week</th>
              <th className="min-w-[210px] px-3 py-3 font-semibold">Topic</th>
              <th className="min-w-[260px] px-3 py-3 font-semibold">Subtopic</th>
              <th className="w-28 px-3 py-3 text-center font-semibold">Covered</th>
              <th className="min-w-[160px] px-3 py-3 font-semibold">Description</th>
              <th className="w-28 px-3 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coverages.map((coverage) => {
              const topicCustom = customTopicIds.has(coverage.id) || !topics.includes(coverage.topic);
              const subtopicCustom = customSubtopicIds.has(coverage.id) || Boolean(coverage.subtopic && !subtopics.includes(coverage.subtopic));
              return (
                <tr key={coverage.id} className="align-top">
                  <td className="w-24 px-3 py-3"><input aria-label="Week" className={inputClass} type="number" min={1} max={52} value={coverage.week} onChange={(event) => updateCoverage(coverage.id, { week: Number(event.target.value) })} /></td>
                  <td className="px-3 py-3">{renderTopicFields(coverage.topic, topicCustom, (topic) => updateCoverage(coverage.id, { topic }), (customTopic) => {
                    setCustomTopicIds((current) => {
                      const next = new Set(current);
                      if (customTopic) next.add(coverage.id);
                      else next.delete(coverage.id);
                      return next;
                    });
                    if (!customTopic && !topics.includes(coverage.topic)) updateCoverage(coverage.id, { topic: "" });
                  })}</td>
                  <td className="px-3 py-3">{renderSubtopicFields(coverage.subtopic ?? "", subtopicCustom, (subtopic) => updateCoverage(coverage.id, { subtopic }), (customSubtopic) => {
                    setCustomSubtopicIds((current) => {
                      const next = new Set(current);
                      if (customSubtopic) next.add(coverage.id);
                      else next.delete(coverage.id);
                      return next;
                    });
                    if (!customSubtopic && coverage.subtopic && !subtopics.includes(coverage.subtopic)) updateCoverage(coverage.id, { subtopic: null });
                  })}</td>
                  <td className="px-3 py-3 text-center">
                    <Checkbox checked={coverage.covered} onCheckedChange={(checked) => void setCovered(coverage, checked === true)} aria-label={`Covered week ${coverage.week}`} className="mx-auto" />
                  </td>
                  <td className="px-3 py-3"><input className={inputClass} maxLength={500} value={coverage.description ?? ""} onChange={(event) => updateCoverage(coverage.id, { description: event.target.value || null })} placeholder="Optional" /></td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => void saveCoverage(coverage)} disabled={savingId === coverage.id} aria-label={`Save week ${coverage.week}`} className="rounded-md p-2 text-accent transition hover:bg-accent/10 disabled:opacity-50">
                        {savingId === coverage.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => void deleteCoverage(coverage)} disabled={deletingId === coverage.id} aria-label={`Delete week ${coverage.week}`} className="rounded-md p-2 text-destructive transition hover:bg-destructive/10 disabled:opacity-50">
                        {deletingId === coverage.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {coverages.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No weeks planned yet. Add the first topic above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
