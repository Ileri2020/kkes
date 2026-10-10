"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";

type YearOption = { year: number; count: number };
type SubjectOption = { key: string; label: string; years: YearOption[] };

type Question = {
  id: string;
  subject?: string;
  year: number | string;
  questionNumber: number | null;
  question: string;
  passage: string | null;
  options: string[];
  image: string | null;
};

type QuestionOutcome = {
  questionId: string;
  isCorrect: boolean;
  selectedAnswer: string | null;
  correctAnswer: string | null;
};

type JambSubmission = {
  resultId: string;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  questionResults: QuestionOutcome[];
};

type SubtopicItem = { name: string; count: number };
type TopicItem = { name: string; count: number; subtopics: SubtopicItem[] };

type CustomSelection = {
  topics: string[];
  subtopics: string[];
  estimatedCount: number;
};

const SUBJECT_ORDER = [
  "english",
  "biology",
  "chemistry",
  "physics",
  "mathematics",
  "economics",
  "government",
  "literature",
  "commerce",
  "accounts",
  "crk",
];

/**
 * Calculates target question count per subject based on whether English is selected.
 * - With English: English = 60, other 3 subjects = 40 each (60 + 40 + 40 + 40 = 180 total).
 * - Without English (English replaced): all 4 subjects = 45 each (45 * 4 = 180 total).
 */
const TARGET_FOR = (subjectKey: string, selectedKeys: string[] = ["english"]) => {
  const hasEnglish = selectedKeys.includes("english");
  if (hasEnglish) {
    return subjectKey === "english" ? 60 : 40;
  }
  return 45;
};

// ─── Custom Topics Selection Dialog Component ───────────────────────────────
function CustomTopicDialog({
  subjectKey,
  subjectLabel,
  isOpen,
  onClose,
  initialSelection,
  onSave,
}: {
  subjectKey: string;
  subjectLabel: string;
  isOpen: boolean;
  onClose: () => void;
  initialSelection?: CustomSelection;
  onSave: (selection: CustomSelection) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<Set<string>>(
    new Set(initialSelection?.subtopics || [])
  );
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");

    fetch(`/api/pq/jamb?mode=topics&subject=${encodeURIComponent(subjectKey)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load topics");
        return data.topics as TopicItem[];
      })
      .then((loadedTopics) => {
        setTopics(loadedTopics);
        setExpandedTopics(new Set(loadedTopics.map((t) => t.name)));
        if (!initialSelection || initialSelection.subtopics.length === 0) {
          const allSubs = new Set<string>();
          for (const t of loadedTopics) {
            for (const s of t.subtopics) {
              allSubs.add(s.name);
            }
          }
          setSelectedSubtopics(allSubs);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error loading topics");
      })
      .finally(() => setLoading(false));
  }, [isOpen, subjectKey, initialSelection]);

  if (!isOpen) return null;

  function isTopicFullySelected(topic: TopicItem) {
    if (topic.subtopics.length === 0) return false;
    return topic.subtopics.every((s) => selectedSubtopics.has(s.name));
  }

  function isTopicPartiallySelected(topic: TopicItem) {
    if (topic.subtopics.length === 0) return false;
    const count = topic.subtopics.filter((s) => selectedSubtopics.has(s.name)).length;
    return count > 0 && count < topic.subtopics.length;
  }

  function toggleTopic(topic: TopicItem) {
    const next = new Set(selectedSubtopics);
    const fullySelected = isTopicFullySelected(topic);

    for (const sub of topic.subtopics) {
      if (fullySelected) {
        next.delete(sub.name);
      } else {
        next.add(sub.name);
      }
    }
    setSelectedSubtopics(next);
  }

  function toggleSubtopic(subName: string) {
    const next = new Set(selectedSubtopics);
    if (next.has(subName)) {
      next.delete(subName);
    } else {
      next.add(subName);
    }
    setSelectedSubtopics(next);
  }

  function toggleExpand(topicName: string) {
    const next = new Set(expandedTopics);
    if (next.has(topicName)) {
      next.delete(topicName);
    } else {
      next.add(topicName);
    }
    setExpandedTopics(next);
  }

  function selectAll() {
    const all = new Set<string>();
    for (const t of topics) {
      for (const s of t.subtopics) {
        all.add(s.name);
      }
    }
    setSelectedSubtopics(all);
  }

  function clearAll() {
    setSelectedSubtopics(new Set());
  }

  const estimatedCount = topics.reduce((acc, t) => {
    return (
      acc +
      t.subtopics.reduce((subAcc, s) => {
        return subAcc + (selectedSubtopics.has(s.name) ? s.count : 0);
      }, 0)
    );
  }, 0);

  function handleSave() {
    const selectedTopicsList: string[] = [];
    for (const t of topics) {
      if (t.subtopics.some((s) => selectedSubtopics.has(s.name))) {
        selectedTopicsList.push(t.name);
      }
    }

    onSave({
      topics: selectedTopicsList,
      subtopics: Array.from(selectedSubtopics),
      estimatedCount,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="text-primary" size={20} />
            <div>
              <h3 className="font-bold text-lg">Custom Topics: {subjectLabel}</h3>
              <p className="text-xs text-muted-foreground">
                Select specific topics and subtopics for practice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <LoaderCircle className="animate-spin" size={20} /> Loading topics...
            </div>
          ) : error ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </p>
          ) : topics.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No specific topics found for this subject in the database.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 bg-secondary/50 rounded-xl p-3 text-xs font-semibold">
                <span className="text-muted-foreground">
                  {selectedSubtopics.size} subtopic(s) selected ({estimatedCount} question(s) available)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {topics.map((topic) => {
                  const isFully = isTopicFullySelected(topic);
                  const isPartial = isTopicPartiallySelected(topic);
                  const isExpanded = expandedTopics.has(topic.name);

                  return (
                    <div
                      key={topic.name}
                      className="rounded-xl border border-border bg-background transition-colors"
                    >
                      {/* Topic Header Row */}
                      <div className="flex items-center justify-between p-3.5 gap-3">
                        <label className="flex items-center gap-3 font-medium text-sm cursor-pointer min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isFully}
                            ref={(el) => {
                              if (el) el.indeterminate = isPartial;
                            }}
                            onChange={() => toggleTopic(topic)}
                            className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                          />
                          <span className="truncate">{topic.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground font-normal">
                            ({topic.count} q)
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleExpand(topic.name)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Subtopics List */}
                      {isExpanded && topic.subtopics.length > 0 && (
                        <div className="border-t border-border bg-secondary/20 p-3 space-y-2 pl-9 text-xs">
                          {topic.subtopics.map((sub) => {
                            const isSubChecked = selectedSubtopics.has(sub.name);
                            return (
                              <label
                                key={sub.name}
                                className="flex items-start gap-2.5 cursor-pointer hover:text-foreground text-muted-foreground py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSubChecked}
                                  onChange={() => toggleSubtopic(sub.name)}
                                  className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-[hsl(var(--primary))]"
                                />
                                <span className="flex-1 leading-normal">
                                  {sub.name}
                                </span>
                                <span className="shrink-0 font-semibold opacity-70">
                                  ({sub.count})
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border p-4">
          <span className="text-xs text-muted-foreground">
            {estimatedCount} question(s) will be loaded
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedSubtopics.size === 0}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main JAMB Practice Component ───────────────────────────────────────────
export function JambPractice() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(["english"]);
  const [selectedYears, setSelectedYears] = useState<Record<string, number | "random" | "custom" | "">>({
    english: "random",
  });

  const [customSelections, setCustomSelections] = useState<Record<string, CustomSelection>>({});
  const [activeModalSubject, setActiveModalSubject] = useState<{ key: string; label: string } | null>(null);

  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [practiceError, setPracticeError] = useState("");
  const [activeQuestions, setActiveQuestions] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submission, setSubmission] = useState<JambSubmission | null>(null);
  const [submissionKey, setSubmissionKey] = useState("");
  const submissionInFlight = useRef(false);

  const [durationMinutes, setDurationMinutes] = useState(120);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isManualDuration, setIsManualDuration] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pq/jamb?mode=years", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load JAMB availability.");
        return payload.subjects as SubjectOption[];
      })
      .then((availability) => {
        if (!cancelled) {
          setSubjects(
            availability.sort(
              (left, right) =>
                SUBJECT_ORDER.indexOf(left.key) - SUBJECT_ORDER.indexOf(right.key)
            )
          );
        }
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setAvailabilityError(
            error instanceof Error ? error.message : "Unable to load JAMB availability."
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const orderedSelected = useMemo(
    () =>
      selectedKeys
        .map((key) => subjects.find((subject) => subject.key === key))
        .filter((subject): subject is SubjectOption => Boolean(subject)),
    [selectedKeys, subjects]
  );

  // Calculate target question count for each subject based on whether English is selected
  const hasEnglish = selectedKeys.includes("english");

  const estimatedTotalQuestions = useMemo(() => {
    return orderedSelected.reduce((sum, subject) => {
      const mode = selectedYears[subject.key];
      const target = TARGET_FOR(subject.key, selectedKeys);
      if (mode === "custom" && customSelections[subject.key]) {
        return sum + Math.min(target, customSelections[subject.key].estimatedCount);
      }
      return sum + target;
    }, 0);
  }, [orderedSelected, selectedYears, customSelections, selectedKeys]);

  // Ratio-based default exam duration: 180 questions = 120 minutes (ratio = 120/180 = 2/3)
  const proportionalDefaultMinutes = useMemo(() => {
    if (estimatedTotalQuestions <= 0) return 120;
    return Math.max(10, Math.round(estimatedTotalQuestions * (120 / 180)));
  }, [estimatedTotalQuestions]);

  // Update durationMinutes automatically when proportional default changes, unless manually overridden
  useEffect(() => {
    if (!isManualDuration) {
      setDurationMinutes(proportionalDefaultMinutes);
    }
  }, [proportionalDefaultMinutes, isManualDuration]);

  const currentQuestion = activeQuestions?.[currentIndex];
  const answeredCount = activeQuestions ? Object.keys(answers).length : 0;
  const correctCount = submission?.correctCount ?? 0;

  const selectedYearsComplete = orderedSelected.every(
    (subject) =>
      selectedYears[subject.key] === "random" ||
      selectedYears[subject.key] === "custom" ||
      typeof selectedYears[subject.key] === "number"
  );

  const durationHours = Math.floor(durationMinutes / 60);
  const durationRemainderMinutes = durationMinutes % 60;
  const formattedTime = `${String(Math.floor(remainingSeconds / 3600)).padStart(
    2,
    "0"
  )}:${String(Math.floor((remainingSeconds % 3600) / 60)).padStart(
    2,
    "0"
  )}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!activeQuestions || finished || remainingSeconds <= 0) return;
    const timerId = window.setTimeout(() => {
      if (remainingSeconds <= 1) {
        void submitPractice();
      } else {
        setRemainingSeconds(remainingSeconds - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [activeQuestions, finished, remainingSeconds]);

  function addSubject(subjectKey: string) {
    if (selectedKeys.includes(subjectKey) || selectedKeys.length >= 4) return;
    setPracticeError("");
    setSelectedKeys((current) => [...current, subjectKey]);
    setSelectedYears((current) => ({ ...current, [subjectKey]: "random" }));
  }

  function removeSubject(subjectKey: string) {
    setSelectedKeys((current) => current.filter((key) => key !== subjectKey));
    setSelectedYears((current) => {
      const next = { ...current };
      delete next[subjectKey];
      return next;
    });
    setPracticeError("");
  }

  function handleYearModeSelect(subjectKey: string, val: string) {
    if (val === "custom") {
      setSelectedYears((curr) => ({ ...curr, [subjectKey]: "custom" }));
      const subjObj = subjects.find((s) => s.key === subjectKey);
      if (subjObj) {
        setActiveModalSubject({ key: subjObj.key, label: subjObj.label });
      }
    } else if (val === "random") {
      setSelectedYears((curr) => ({ ...curr, [subjectKey]: "random" }));
    } else if (val === "") {
      setSelectedYears((curr) => ({ ...curr, [subjectKey]: "" }));
    } else {
      setSelectedYears((curr) => ({ ...curr, [subjectKey]: Number(val) }));
    }
  }

  async function startPractice() {
    if (selectedKeys.length !== 4 || !selectedYearsComplete) return;
    setLoadingQuestions(true);
    setPracticeError("");
    try {
      const loaded = await Promise.all(
        orderedSelected.map(async (subject) => {
          const mode = selectedYears[subject.key];
          const targetLimit = TARGET_FOR(subject.key, selectedKeys);
          let url = `/api/pq/jamb?subject=${encodeURIComponent(subject.key)}&limit=${targetLimit}`;

          if (mode === "random") {
            url += `&year=random`;
          } else if (mode === "custom") {
            url += `&year=custom`;
            const selection = customSelections[subject.key];
            if (selection && selection.subtopics.length > 0) {
              url += `&subtopics=${encodeURIComponent(selection.subtopics.join(","))}`;
            }
          } else if (typeof mode === "number") {
            url += `&year=${mode}`;
          }

          const response = await fetch(url, { cache: "no-store" });
          const payload = await response.json();
          if (!response.ok)
            throw new Error(payload.error || `Unable to load ${subject.label}.`);
          return { ...payload, questions: payload.questions as Question[] };
        })
      );

      const combined = loaded.flatMap((result) =>
        result.questions.map((question: Question) => ({
          ...question,
          subject: result.subject as string,
          year: (result.year as number | string) || "Practice",
        }))
      );

      setActiveQuestions(combined);
      setCurrentIndex(0);
      setAnswers({});
      setFinished(false);
      setSubmission(null);
      setSubmissionError("");
      setSubmissionKey(crypto.randomUUID());
      submissionInFlight.current = false;
      setRemainingSeconds(durationMinutes * 60);
    } catch (error) {
      setPracticeError(
        error instanceof Error ? error.message : "Unable to start this practice session."
      );
    } finally {
      setLoadingQuestions(false);
    }
  }

  function resetPractice() {
    setActiveQuestions(null);
    setCurrentIndex(0);
    setAnswers({});
    setFinished(false);
    setSubmission(null);
    setSubmissionError("");
    setSubmissionKey("");
    submissionInFlight.current = false;
    setRemainingSeconds(0);
    setPracticeError("");
  }

  async function submitPractice() {
    if (!activeQuestions || submissionInFlight.current || !submissionKey) return;
    submissionInFlight.current = true;
    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch("/api/pq/jamb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionKey,
          answers: activeQuestions.map((question, index) => ({
            questionId: question.id,
            selectedAnswerIndex: answers[index] ?? null,
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to save the exam result.");
      }
      setSubmission(payload as JambSubmission);
      setFinished(true);
      setRemainingSeconds(0);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Unable to save the exam result.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  // Finished Practice Results view
  if (activeQuestions && finished) {
    const outcomesByQuestionId = new Map(
      (submission?.questionResults ?? []).map((outcome) => [outcome.questionId, outcome])
    );
    return (
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent">
            <Check size={27} />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Exam submitted and result saved
          </p>
          <h3 className="mt-2 text-3xl font-bold">
            {correctCount} / {activeQuestions.length}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {answeredCount} answered · {activeQuestions.length - answeredCount} unanswered ·{" "}
            {activeQuestions.length
              ? Math.round((correctCount / activeQuestions.length) * 100)
              : 0}
            %
          </p>
          <button
            onClick={resetPractice}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            <RotateCcw size={16} /> Set up another session
          </button>
        </div>
        <div className="mx-auto mt-8 max-w-4xl space-y-3">
          {activeQuestions.map((question, index) => {
            const selectedIndex = answers[index];
            const outcome = outcomesByQuestionId.get(question.id);
            const isCorrect = outcome?.isCorrect ?? false;
            return (
              <article
                key={`${question.subject}-${question.year}-${question.questionNumber ?? index}`}
                className={`rounded-xl border p-4 ${
                  isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Question {index + 1} · {question.subject} ({question.year})
                </p>
                <p className="mt-2 font-medium">{question.question}</p>
                <p className="mt-3 text-sm">
                  Your answer:{" "}
                  <span className="font-semibold">
                    {selectedIndex === undefined
                      ? "Not answered"
                      : outcome?.selectedAnswer ?? question.options[selectedIndex]}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  Correct answer:{" "}
                  <span className="font-semibold">
                    {outcome?.correctAnswer ?? "Not available"}
                  </span>
                </p>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  // Active Practice Session view
  if (activeQuestions && currentQuestion) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {currentQuestion.subject} · {currentQuestion.year}
            </p>
            <h3 className="mt-1 font-bold">
              Question {currentIndex + 1}{" "}
              <span className="font-normal text-muted-foreground">
                of {activeQuestions.length}
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              role="timer"
              aria-live="off"
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold tabular-nums ${
                remainingSeconds <= 300
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Clock3 size={16} />
              {formattedTime}
            </span>
            <button
              onClick={resetPractice}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
            >
              Exit practice
            </button>
          </div>
        </div>
        {currentQuestion.passage && (
          <div className="mb-5 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
            {currentQuestion.passage}
          </div>
        )}
        <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <p className="text-lg font-medium leading-7">{currentQuestion.question}</p>
          <div className="mt-5 flex min-h-0 justify-center sm:min-h-8">
            {currentQuestion.image && (
              <Image
                src={currentQuestion.image}
                alt={`Illustration for question ${currentIndex + 1}`}
                width={720}
                height={480}
                unoptimized
                className="max-h-80 w-auto max-w-full rounded-lg object-contain"
              />
            )}
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {currentQuestion.options.map((option, optionIndex) => {
            const checked = answers[currentIndex] === optionIndex;
            return (
              <label
                key={`${optionIndex}-${option}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors ${
                  checked
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-secondary/60"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentIndex}`}
                  checked={checked}
                  onChange={() =>
                    setAnswers((current) => ({ ...current, [currentIndex]: optionIndex }))
                  }
                  className="mt-0.5 accent-[hsl(var(--primary))]"
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => index - 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} /> Previous
          </button>
          <p className="text-xs text-muted-foreground">
            {answeredCount} answered · {activeQuestions.length - answeredCount} remaining
          </p>
          {currentIndex < activeQuestions.length - 1 && (
            <button
              onClick={() => setCurrentIndex((index) => index + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Next <ChevronRight size={17} />
            </button>
          )}
        </div>
        <div
          className="mt-5 flex flex-wrap gap-1.5 border-t border-border pt-5"
          aria-label="Question navigation"
        >
          {activeQuestions.map((_, index) => (
            <button
              key={index}
              aria-label={`Go to question ${index + 1}`}
              aria-current={index === currentIndex ? "step" : undefined}
              onClick={() => setCurrentIndex(index)}
              className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold ${
                index === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : answers[index] !== undefined
                  ? "bg-accent/20 text-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end border-t border-border pt-5">
          <button
            onClick={() => void submitPractice()}
            disabled={isSubmitting}
            className="rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground"
          >
            {isSubmitting ? "Saving result…" : submissionError ? "Retry saving result" : "Submit exam"}
          </button>
        </div>
        {submissionError && (
          <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {submissionError} Your answers are still here; retry to finish the exam.
          </p>
        )}
      </section>
    );
  }

  // Practice Setup view
  return (
    <div className="space-y-6">
      {/* ── 1. Select Four Subjects ────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Choose your four subjects</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              English is defaultly selected. You can keep English or remove it to pick any 4 subjects.
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
            {selectedKeys.length}/4 selected
          </span>
        </div>
        {loadingAvailability ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <LoaderCircle className="animate-spin" size={18} /> Loading available subjects...
          </div>
        ) : availabilityError ? (
          <p role="alert" className="mt-5 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {availabilityError}
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-start">
            <label className="grid gap-2 text-sm font-medium">
              <span>Add a subject</span>
              <select
                value=""
                onChange={(event) => addSubject(event.target.value)}
                disabled={selectedKeys.length >= 4}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {selectedKeys.length >= 4 ? "Four subjects selected" : "Choose a subject"}
                </option>
                {subjects.map((subject) => (
                  <option
                    key={subject.key}
                    value={subject.key}
                    disabled={selectedKeys.includes(subject.key)}
                  >
                    {subject.label}
                    {subject.key === "english" ? " (Default)" : ""}
                    {selectedKeys.includes(subject.key) ? " · selected" : ""}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                Choose {4 - selectedKeys.length} more subject
                {4 - selectedKeys.length === 1 ? "" : "s"}.
              </span>
            </label>
            <div className="grid gap-2" aria-label="Selected subjects">
              {orderedSelected.map((subject) => {
                const targetCount = TARGET_FOR(subject.key, selectedKeys);
                const isEnglish = subject.key === "english";

                return (
                  <div
                    key={subject.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                      <Check size={16} className="shrink-0 text-primary" />
                      {subject.label}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({isEnglish ? "Default Compulsory" : "Selected"} · {targetCount} q)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubject(subject.key)}
                      aria-label={`Remove ${subject.label}`}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── 2. Select Paper Mode / Year ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <h3 className="font-bold">Select a paper mode / year</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a specific year, pick random questions across all years, or select custom topics.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {orderedSelected.map((subject) => {
            const required = TARGET_FOR(subject.key, selectedKeys);
            const currentVal = selectedYears[subject.key] ?? "";
            const isCustom = currentVal === "custom";

            return (
              <div key={subject.key} className="grid gap-2 text-sm font-medium">
                <span className="flex items-center justify-between">
                  <span>
                    {subject.label}{" "}
                    <span className="text-muted-foreground font-normal">({required} q)</span>
                  </span>
                </span>
                <div className="space-y-1.5">
                  <select
                    value={String(currentVal)}
                    onChange={(event) => handleYearModeSelect(subject.key, event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-3 text-foreground focus:ring-2 focus:ring-primary"
                    disabled={loadingAvailability}
                  >
                    <option value="">Choose paper mode</option>
                    <option value="random">⚡ Random (Across all years)</option>
                    <option value="custom">🎯 Custom (Select Topics & Subtopics)</option>
                    <optgroup label="Specific Exam Years">
                      {subject.years.map(({ year, count }) => (
                        <option key={year} value={year}>
                          Year {year} · {count} questions
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* If custom is selected, show edit button */}
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveModalSubject({ key: subject.key, label: subject.label })
                      }
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      <Filter size={14} />
                      {customSelections[subject.key]?.subtopics?.length
                        ? `Configured (${customSelections[subject.key].subtopics.length} subtopics)`
                        : "Configure Topics"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {orderedSelected.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select subjects above to choose their paper modes.
            </p>
          )}
        </div>
      </section>

      {/* ── 3. Exam Time Limit Section ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 font-bold">
              <Clock3 size={18} /> Exam time limit
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Calculated proportionally at ~40 seconds per question (120 mins for 180 questions).
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
            <button
              type="button"
              aria-label="Decrease time by 10 minutes"
              onClick={() => {
                setIsManualDuration(true);
                setDurationMinutes((minutes) => Math.max(10, minutes - 10));
              }}
              disabled={durationMinutes <= 10}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-20 text-center text-sm font-bold tabular-nums">
              {durationHours}h {String(durationRemainderMinutes).padStart(2, "0")}m
            </span>
            <button
              type="button"
              aria-label="Increase time by 10 minutes"
              onClick={() => {
                setIsManualDuration(true);
                setDurationMinutes((minutes) => minutes + 10);
              }}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="grid max-w-sm grid-cols-2 gap-3 flex-1">
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Hours
              <input
                type="number"
                min={0}
                max={99}
                value={durationHours}
                onChange={(event) => {
                  setIsManualDuration(true);
                  const hours = Math.min(99, Math.max(0, Number(event.target.value) || 0));
                  setDurationMinutes(hours * 60 + durationRemainderMinutes);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Minutes
              <input
                type="number"
                min={0}
                max={59}
                value={durationRemainderMinutes}
                onChange={(event) => {
                  setIsManualDuration(true);
                  const minutes = Math.min(59, Math.max(0, Number(event.target.value) || 0));
                  setDurationMinutes(durationHours * 60 + minutes);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              />
            </label>
          </div>

          {isManualDuration && (
            <button
              type="button"
              onClick={() => {
                setIsManualDuration(false);
                setDurationMinutes(proportionalDefaultMinutes);
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Reset to proportional default ({proportionalDefaultMinutes}m)
            </button>
          )}
        </div>
      </section>

      {/* ── 4. Practice Summary & Start Practice Button ────────────────────── */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div>
          <p className="font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-primary" /> JAMB Practice Simulator
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {estimatedTotalQuestions} total question{estimatedTotalQuestions === 1 ? "" : "s"}{" "}
            {hasEnglish ? "(60 English + 40 × 3)" : "(45 × 4 equal subjects)"} · {durationMinutes} min practice paper
          </p>
        </div>
        <button
          onClick={startPractice}
          disabled={
            loadingAvailability ||
            loadingQuestions ||
            durationMinutes < 1 ||
            selectedKeys.length !== 4 ||
            !selectedYearsComplete
          }
          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loadingQuestions && <LoaderCircle size={17} className="animate-spin" />}
          {loadingQuestions ? "Loading paper…" : "Start practice"}
        </button>
        {practiceError && (
          <p role="alert" className="w-full text-sm text-destructive">
            {practiceError}
          </p>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <BookOpen size={15} /> All practice questions are served directly from the database bank.
      </p>

      {/* ── Custom Topics Dialog Modal ──────────────────────────────────────── */}
      {activeModalSubject && (
        <CustomTopicDialog
          subjectKey={activeModalSubject.key}
          subjectLabel={activeModalSubject.label}
          isOpen={Boolean(activeModalSubject)}
          onClose={() => setActiveModalSubject(null)}
          initialSelection={customSelections[activeModalSubject.key]}
          onSave={(selection) => {
            setCustomSelections((prev) => ({
              ...prev,
              [activeModalSubject.key]: selection,
            }));
          }}
        />
      )}
    </div>
  );
}
