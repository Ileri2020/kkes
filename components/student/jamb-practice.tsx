"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Minus, Plus, RotateCcw, X } from "lucide-react";

type YearOption = { year: number; count: number };
type SubjectOption = { key: string; label: string; years: YearOption[] };
type Question = {
  subject?: string;
  year: number;
  questionNumber: number | null;
  question: string;
  passage: string | null;
  options: string[];
  image: string | null;
};
const SUBJECT_ORDER = ["english", "biology", "chemistry", "physics", "mathematics", "economics", "government", "literature", "commerce", "accounts", "crk"];
const TARGET_FOR = (subjectKey: string) => subjectKey === "english" ? 60 : 40;

export function JambPractice() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(["english"]);
  const [selectedYears, setSelectedYears] = useState<Record<string, number | "">>({});
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [practiceError, setPracticeError] = useState("");
  const [activeQuestions, setActiveQuestions] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pq/jamb?mode=years", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load JAMB availability.");
        return payload.subjects as SubjectOption[];
      })
      .then((availability) => {
        if (!cancelled) setSubjects(availability.sort((left, right) => SUBJECT_ORDER.indexOf(left.key) - SUBJECT_ORDER.indexOf(right.key)));
      })
      .catch((error: unknown) => {
        if (!cancelled) setAvailabilityError(error instanceof Error ? error.message : "Unable to load JAMB availability.");
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => { cancelled = true; };
  }, []);

  const orderedSelected = useMemo(
    () => selectedKeys.map((key) => subjects.find((subject) => subject.key === key)).filter((subject): subject is SubjectOption => Boolean(subject)),
    [selectedKeys, subjects],
  );
  const totalQuestions = orderedSelected.reduce((total, subject) => total + TARGET_FOR(subject.key), 0);
  const currentQuestion = activeQuestions?.[currentIndex];
  const answeredCount = activeQuestions ? Object.keys(answers).length : 0;
  const selectedYearsComplete = orderedSelected.every((subject) => typeof selectedYears[subject.key] === "number");
  const durationHours = Math.floor(durationMinutes / 60);
  const durationRemainderMinutes = durationMinutes % 60;
  const formattedTime = `${String(Math.floor(remainingSeconds / 3600)).padStart(2, "0")}:${String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!activeQuestions || finished) return;
    const timerId = window.setInterval(() => {
      setRemainingSeconds((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(timerId);
          setFinished(true);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [activeQuestions, finished]);

  function addSubject(subjectKey: string) {
    if (subjectKey === "english" || selectedKeys.includes(subjectKey) || selectedKeys.length >= 4) return;
    setPracticeError("");
    setSelectedKeys((current) => [...current, subjectKey]);
  }

  function removeSubject(subjectKey: string) {
    if (subjectKey === "english") return;
    setSelectedKeys((current) => current.filter((key) => key !== subjectKey));
    setSelectedYears((current) => {
      const next = { ...current };
      delete next[subjectKey];
      return next;
    });
    setPracticeError("");
  }

  async function startPractice() {
    if (selectedKeys.length !== 4 || !selectedYearsComplete) return;
    setLoadingQuestions(true);
    setPracticeError("");
    try {
      const loaded = await Promise.all(orderedSelected.map(async (subject) => {
        const year = selectedYears[subject.key];
        const response = await fetch(`/api/pq/jamb?subject=${encodeURIComponent(subject.key)}&year=${year}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Unable to load ${subject.label}.`);
        return { ...payload, questions: payload.questions as Question[] };
      }));
      const combined = loaded.flatMap((result) => result.questions.map((question: Question) => ({
        ...question,
        subject: result.subject as string,
        year: result.year as number,
      })));
      setActiveQuestions(combined);
      setCurrentIndex(0);
      setAnswers({});
      setFinished(false);
      setRemainingSeconds(durationMinutes * 60);
    } catch (error) {
      setPracticeError(error instanceof Error ? error.message : "Unable to start this practice session.");
    } finally {
      setLoadingQuestions(false);
    }
  }

  function resetPractice() {
    setActiveQuestions(null);
    setCurrentIndex(0);
    setAnswers({});
    setFinished(false);
    setRemainingSeconds(0);
    setPracticeError("");
  }

  if (activeQuestions && finished) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent"><Check size={27} /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Practice session complete</p>
          <h3 className="mt-2 text-2xl font-bold">Good work!</h3>
          <p className="mt-3 text-muted-foreground">You answered {answeredCount} of {activeQuestions.length} questions. Answers are saved for this session only.</p>
          <button onClick={resetPractice} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><RotateCcw size={16} /> Set up another session</button>
        </div>
      </section>
    );
  }

  if (activeQuestions && currentQuestion) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{currentQuestion.subject} · {currentQuestion.year}</p>
            <h3 className="mt-1 font-bold">Question {currentIndex + 1} <span className="font-normal text-muted-foreground">of {activeQuestions.length}</span></h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span role="timer" aria-live="off" className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold tabular-nums ${remainingSeconds <= 300 ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}><Clock3 size={16} />{formattedTime}</span>
            <button onClick={resetPractice} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">Exit practice</button>
          </div>
        </div>
        {currentQuestion.passage && <div className="mb-5 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">{currentQuestion.passage}</div>}
        <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <p className="text-lg font-medium leading-7">{currentQuestion.question}</p>
          <div className="mt-5 flex min-h-0 justify-center sm:min-h-8">
            {currentQuestion.image && <Image src={currentQuestion.image} alt={`Illustration for question ${currentIndex + 1}`} width={720} height={480} unoptimized className="max-h-80 w-auto max-w-full rounded-lg object-contain" />}
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {currentQuestion.options.map((option, optionIndex) => {
            const checked = answers[currentIndex] === optionIndex;
            return <label key={`${optionIndex}-${option}`} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors ${checked ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/60"}`}>
              <input type="radio" name={`question-${currentIndex}`} checked={checked} onChange={() => setAnswers((current) => ({ ...current, [currentIndex]: optionIndex }))} className="mt-0.5 accent-[hsl(var(--primary))]" />
              <span>{option}</span>
            </label>;
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /> Previous</button>
          <p className="text-xs text-muted-foreground">{answeredCount} answered · {activeQuestions.length - answeredCount} remaining</p>
          {currentIndex < activeQuestions.length - 1 && <button onClick={() => setCurrentIndex((index) => index + 1)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Next <ChevronRight size={17} /></button>}
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border pt-5" aria-label="Question navigation">
          {activeQuestions.map((_, index) => (
            <button key={index} aria-label={`Go to question ${index + 1}`} aria-current={index === currentIndex ? "step" : undefined} onClick={() => setCurrentIndex(index)} className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold ${index === currentIndex ? "bg-primary text-primary-foreground" : answers[index] !== undefined ? "bg-accent/20 text-foreground" : "bg-secondary text-muted-foreground"}`}>{index + 1}</button>
          ))}
        </div>
        <div className="mt-5 flex justify-end border-t border-border pt-5">
          <button onClick={() => setFinished(true)} className="rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground">Submit exam</button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Choose your four subjects</h3>
            <p className="mt-1 text-sm text-muted-foreground">English is compulsory. Select three more subjects and choose a year for each.</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">{selectedKeys.length}/4 selected</span>
        </div>
        {loadingAvailability ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={18} /> Loading available subjects and years…</div>
          : availabilityError ? <p role="alert" className="mt-5 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{availabilityError}</p>
            : <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-start">
              <label className="grid gap-2 text-sm font-medium">
                <span>Add a subject</span>
                <select
                  value=""
                  onChange={(event) => addSubject(event.target.value)}
                  disabled={selectedKeys.length >= 4}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{selectedKeys.length >= 4 ? "Four subjects selected" : "Choose a subject"}</option>
                  {subjects.filter((subject) => subject.key !== "english").map((subject) => {
                    const eligibleYears = subject.years.filter(({ count }) => count >= TARGET_FOR(subject.key)).length;
                    return <option key={subject.key} value={subject.key} disabled={selectedKeys.includes(subject.key) || eligibleYears === 0}>
                      {subject.label}{selectedKeys.includes(subject.key) ? " · selected" : ""}{eligibleYears === 0 ? " · unavailable" : ""}
                    </option>;
                  })}
                </select>
                <span className="text-xs text-muted-foreground">Choose {4 - selectedKeys.length} more subject{4 - selectedKeys.length === 1 ? "" : "s"}.</span>
              </label>
              <div className="grid gap-2" aria-label="Selected subjects">
                {orderedSelected.map((subject) => {
                  const compulsory = subject.key === "english";
                  return <div key={subject.key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium"><Check size={16} className="shrink-0 text-primary" />{subject.label}{compulsory && <span className="text-xs text-muted-foreground">Compulsory</span>}</span>
                    {!compulsory && <button type="button" onClick={() => removeSubject(subject.key)} aria-label={`Remove ${subject.label}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><X size={16} /></button>}
                  </div>;
                })}
              </div>
            </div>}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <h3 className="font-bold">Select a paper year</h3>
        <p className="mt-1 text-sm text-muted-foreground">Only years with enough extracted questions for a full JAMB paper can be selected.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {orderedSelected.map((subject) => {
            const required = TARGET_FOR(subject.key);
            const availableYears = subject.years.filter(({ count }) => count >= required);
            return <label key={subject.key} className="grid gap-2 text-sm font-medium">
              <span>{subject.label} <span className="text-muted-foreground">({required} questions)</span></span>
              <select value={selectedYears[subject.key] ?? ""} onChange={(event) => setSelectedYears((current) => ({ ...current, [subject.key]: event.target.value ? Number(event.target.value) : "" }))} className="w-full rounded-xl border border-border bg-background px-3 py-3 text-foreground" disabled={loadingAvailability || availableYears.length === 0}>
                <option value="">Choose year</option>
                {subject.years.map(({ year, count }) => <option key={year} value={year} disabled={count < required}>{year} · {count} questions{count < required ? ` (need ${required})` : ""}</option>)}
              </select>
            </label>;
          })}
          {orderedSelected.length === 0 && <p className="text-sm text-muted-foreground">Select subjects above to choose their years.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 font-bold"><Clock3 size={18} /> Exam time limit</h3>
            <p className="mt-1 text-sm text-muted-foreground">Default is 2 hours. The exam submits automatically when time runs out.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
            <button type="button" aria-label="Decrease time by 10 minutes" onClick={() => setDurationMinutes((minutes) => Math.max(10, minutes - 10))} disabled={durationMinutes <= 10} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-40"><Minus size={16} /></button>
            <span className="min-w-20 text-center text-sm font-bold tabular-nums">{durationHours}h {String(durationRemainderMinutes).padStart(2, "0")}m</span>
            <button type="button" aria-label="Increase time by 10 minutes" onClick={() => setDurationMinutes((minutes) => minutes + 10)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"><Plus size={16} /></button>
          </div>
        </div>
        <div className="mt-4 grid max-w-sm grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Hours
            <input type="number" min={0} max={99} value={durationHours} onChange={(event) => {
              const hours = Math.min(99, Math.max(0, Number(event.target.value) || 0));
              setDurationMinutes(hours * 60 + durationRemainderMinutes);
            }} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Minutes
            <input type="number" min={0} max={59} value={durationRemainderMinutes} onChange={(event) => {
              const minutes = Math.min(59, Math.max(0, Number(event.target.value) || 0));
              setDurationMinutes(durationHours * 60 + minutes);
            }} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground" />
          </label>
        </div>
      </section>

      <fieldset disabled className="grid gap-4 rounded-2xl border border-border bg-card p-5 opacity-60 sm:grid-cols-3 sm:p-6">
        {["Topic", "Difficulty", "Question type"].map((filter) => <label key={filter} className="grid gap-2 text-sm font-medium">{filter}<select className="rounded-xl border border-border bg-background px-3 py-3 text-foreground"><option>Coming soon</option></select></label>)}
      </fieldset>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div><p className="font-semibold">Full JAMB practice paper</p><p className="mt-1 text-sm text-muted-foreground">60 Use of English questions + 40 questions for each of your other subjects · {totalQuestions} total</p></div>
        <button onClick={startPractice} disabled={loadingAvailability || loadingQuestions || durationMinutes < 1 || selectedKeys.length !== 4 || !selectedYearsComplete} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45">
          {loadingQuestions && <LoaderCircle size={17} className="animate-spin" />}{loadingQuestions ? "Loading paper…" : "Start practice"}
        </button>
        {practiceError && <p role="alert" className="w-full text-sm text-destructive">{practiceError}</p>}
      </section>
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><BookOpen size={15} /> Each practice session is drawn from the extracted local JAMB question JSON.</p>
    </div>
  );
}
