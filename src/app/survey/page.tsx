"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Answer, Question, ResponseRow } from "@/lib/types";
import {
  api,
  makeDebouncer,
  saveAnswer,
  TEAMS,
  type QuestionsData,
  type ResponseData,
} from "@/lib/client";

const TOKEN_KEY = "gw_token";

type Phase = "loading" | "identity" | "question" | "review" | "done";

type Draft = { body: string; is_unsure: boolean; is_skipped: boolean };

function SurveyInner() {
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [response, setResponse] = useState<ResponseRow | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const debounce = useMemo(() => makeDebouncer(700), []);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // Boot: load questions, then try to resume from ?r= or localStorage.
  useEffect(() => {
    (async () => {
      try {
        const { questions } = await api<QuestionsData>("/api/questions");
        setQuestions(questions);
        const token =
          params.get("r") || localStorage.getItem(TOKEN_KEY) || "";
        if (token) {
          try {
            const data = await api<ResponseData>(`/api/responses/${token}`);
            if (data.response.mode === "async") {
              localStorage.setItem(TOKEN_KEY, token);
              setResponse(data.response);
              const map: Record<string, Draft> = {};
              for (const a of data.answers) {
                map[a.question_id] = {
                  body: a.body,
                  is_unsure: a.is_unsure,
                  is_skipped: a.is_skipped,
                };
              }
              setDrafts(map);
              if (data.response.status === "submitted") {
                setPhase("done");
                return;
              }
              const firstUnanswered = questions.findIndex((q) => {
                const d = map[q.id];
                return !d || (!d.body.trim() && !d.is_skipped && !d.is_unsure);
              });
              setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
              setPhase("question");
              return;
            }
          } catch {
            localStorage.removeItem(TOKEN_KEY);
          }
        }
        setPhase("identity");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const token = response?.resume_token ?? "";
  const question = questions[index];
  const draft: Draft = (question && drafts[question.id]) || {
    body: "",
    is_unsure: false,
    is_skipped: false,
  };

  const updateDraft = (patch: Partial<Draft>) => {
    if (!question || !token) return;
    const next = { ...draft, ...patch };
    setDrafts((d) => ({ ...d, [question.id]: next }));
    const qid = question.id;
    debounce(qid, () => {
      const latest = draftsRef.current[qid];
      if (latest) {
        saveAnswer(token, qid, latest).catch(() =>
          showToast("Couldn't save — check your connection")
        );
      }
    });
  };

  const flush = useCallback(
    (qid: string) => {
      const latest = draftsRef.current[qid];
      if (latest && token) {
        saveAnswer(token, qid, latest).catch(() => {});
      }
    },
    [token]
  );

  const goTo = (i: number, nextPhase: Phase = "question") => {
    if (question) flush(question.id);
    setIndex(i);
    setPhase(nextPhase);
    window.scrollTo(0, 0);
  };

  const next = () => {
    if (!question) return;
    if (draft.body.trim() && draft.is_skipped) updateDraft({ is_skipped: false });
    if (index + 1 >= questions.length) goTo(index, "review");
    else goTo(index + 1);
  };

  const skip = () => {
    updateDraft({ is_skipped: true });
    // flush with the skip applied
    if (question && token) {
      saveAnswer(token, question.id, { ...draft, is_skipped: true }).catch(() => {});
    }
    if (index + 1 >= questions.length) {
      setIndex(index);
      setPhase("review");
    } else {
      setIndex(index + 1);
    }
    window.scrollTo(0, 0);
  };

  const copyResumeLink = async () => {
    const url = `${location.origin}/survey?r=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Resume link copied — open it on any device to continue");
    } catch {
      prompt("Copy this link to continue later:", url);
    }
  };

  const submit = async () => {
    try {
      await api(`/api/responses/${token}`, {
        method: "PATCH",
        body: JSON.stringify({ submit: true }),
      });
      setPhase("done");
      window.scrollTo(0, 0);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Submit failed — try again");
    }
  };

  const startFresh = () => {
    localStorage.removeItem(TOKEN_KEY);
    location.href = "/survey";
  };

  // ------- screens -------

  if (error) {
    return (
      <Shell>
        <p className="text-vi-muted">{error}</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-vi-primary">
          ← Back to start
        </Link>
      </Shell>
    );
  }

  if (phase === "loading") {
    return (
      <Shell>
        <p className="text-vi-muted">Loading…</p>
      </Shell>
    );
  }

  if (phase === "identity") {
    return (
      <IdentityScreen
        onCreated={(r) => {
          localStorage.setItem(TOKEN_KEY, r.resume_token);
          history.replaceState(null, "", `/survey?r=${r.resume_token}`);
          setResponse(r);
          setPhase("question");
        }}
      />
    );
  }

  if (phase === "done") {
    return (
      <main className="min-h-screen bg-vi-navy">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16 text-white">
          <p className="eyebrow text-white/70">Groundwork · Vertical Institute</p>
          <h1 className="mt-3 text-4xl">
            Thank you{response ? `, ${response.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-4 text-white/80">
            Your answers feed directly into the corporate hub revamp, the new
            case-study strategy, and the enquiry form Sales asked for. The UX
            team will follow up on anything you flagged as unsure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={startFresh}
              className="rounded-[var(--radius-btn)] border-[1.5px] border-white/50 px-6 py-2.5 font-semibold text-white transition hover:border-white"
            >
              Start a new response
            </button>
            <Link
              href="/"
              className="rounded-[var(--radius-btn)] px-6 py-2.5 font-semibold text-white/70 transition hover:text-white"
            >
              Back to start
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "review") {
    const answered = questions.filter((q) => drafts[q.id]?.body.trim()).length;
    return (
      <Shell wide>
        <p className="eyebrow text-vi-primary">Review your answers</p>
        <h1 className="mt-2 text-3xl">
          {answered} of {questions.length} answered
        </h1>
        <p className="mt-2 text-vi-muted">
          Tap any question to edit. Skipped and unsure items are flagged — both
          are fine to submit.
        </p>
        <ul className="mt-6 space-y-2">
          {questions.map((q, i) => {
            const d = drafts[q.id];
            return (
              <li key={q.id}>
                <button
                  onClick={() => goTo(i)}
                  className="w-full rounded-xl border border-vi-border bg-white p-4 text-left transition hover:border-vi-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-heading text-sm font-bold text-vi-primary">
                      {q.code}
                    </span>
                    <span className="flex gap-1.5">
                      {d?.is_unsure && <Badge tone="amber">Unsure</Badge>}
                      {!d?.body.trim() && d?.is_skipped && (
                        <Badge tone="grey">Skipped</Badge>
                      )}
                      {!d?.body.trim() && !d?.is_skipped && !d?.is_unsure && (
                        <Badge tone="grey">No answer</Badge>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{q.prompt}</p>
                  {d?.body.trim() && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-vi-muted">
                      {d.body}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="sticky bottom-0 -mx-6 mt-6 border-t border-vi-border bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={copyResumeLink}
              className="text-sm font-semibold text-vi-primary"
            >
              Continue later
            </button>
            <button
              onClick={submit}
              className="rounded-[var(--radius-btn)] bg-vi-primary px-7 py-3 font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark"
            >
              Submit my answers
            </button>
          </div>
        </div>
        {toast && <Toast msg={toast} />}
      </Shell>
    );
  }

  // question phase
  if (!question) return null;
  const themeQuestions = questions.filter((q) => q.theme === question.theme);
  const themeIndex = themeQuestions.findIndex((q) => q.id === question.id);

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <p className="eyebrow text-vi-primary">{question.theme}</p>
        <p className="text-xs font-semibold text-vi-muted">
          {index + 1} / {questions.length}
        </p>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-vi-ice-deep"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
      >
        <div
          className="h-full rounded-full bg-vi-primary transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-vi-muted">
        Question {themeIndex + 1} of {themeQuestions.length} in this theme
      </p>

      <h1 className="mt-6 text-2xl leading-snug sm:text-[28px]">
        {question.prompt}
      </h1>
      <p className="mt-3 rounded-xl bg-vi-ice px-4 py-3 text-sm text-vi-muted">
        <span className="font-semibold text-vi-text">Why we&apos;re asking: </span>
        {question.helper}
      </p>

      <textarea
        value={draft.body}
        onChange={(e) => updateDraft({ body: e.target.value })}
        onBlur={() => flush(question.id)}
        placeholder="Type your answer — rough notes are perfect…"
        rows={7}
        autoFocus
        className="mt-5 w-full rounded-xl border border-vi-border p-4 text-[15.5px] leading-relaxed transition focus:border-vi-primary"
      />

      <button
        onClick={() => updateDraft({ is_unsure: !draft.is_unsure })}
        aria-pressed={draft.is_unsure}
        className={`mt-3 flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition ${
          draft.is_unsure
            ? "border-vi-amber bg-amber-50 font-semibold text-vi-text"
            : "border-vi-border text-vi-muted hover:border-vi-amber"
        }`}
      >
        <span
          className={`flex size-4.5 shrink-0 items-center justify-center rounded border ${
            draft.is_unsure
              ? "border-vi-amber bg-vi-amber text-white"
              : "border-vi-border bg-white"
          }`}
          aria-hidden
        >
          {draft.is_unsure && "✓"}
        </span>
        I&apos;m unsure — this needs checking before we rely on it
      </button>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (index === 0 ? undefined : goTo(index - 1))}
            disabled={index === 0}
            className="text-sm font-semibold text-vi-muted transition hover:text-vi-text disabled:opacity-40"
          >
            ← Back
          </button>
          <button onClick={skip} className="text-sm font-semibold text-vi-muted transition hover:text-vi-text">
            Skip
          </button>
        </div>
        <button
          onClick={next}
          className="rounded-[var(--radius-btn)] bg-vi-primary px-7 py-3 font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark"
        >
          {index + 1 === questions.length ? "Review answers" : "Next →"}
        </button>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-vi-border pt-4">
        <p className="text-xs text-vi-muted">Autosaves as you type</p>
        <button
          onClick={copyResumeLink}
          className="text-xs font-semibold text-vi-primary"
        >
          Continue later — copy resume link
        </button>
      </div>
      {toast && <Toast msg={toast} />}
    </Shell>
  );
}

function IdentityScreen({ onCreated }: { onCreated: (r: ResponseRow) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState(TEAMS[0]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { response } = await api<{ response: ResponseRow }>(
        "/api/responses",
        {
          method: "POST",
          body: JSON.stringify({ mode: "async", name, role, team, email }),
        }
      );
      onCreated(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <Shell>
      <p className="eyebrow text-vi-primary">Before we start</p>
      <h1 className="mt-2 text-3xl">Who&apos;s answering?</h1>
      <p className="mt-2 text-vi-muted">
        So the UX team can follow up on your answers — especially the ones that
        point to specific clients or need checking.
      </p>
      <form onSubmit={start} className="mt-6 space-y-4">
        <Field label="Full name" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
          />
        </Field>
        <Field label="Role / title" required>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            placeholder="e.g. Corporate Sales Manager"
            className="w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
          />
        </Field>
        <Field label="Team">
          <div className="flex flex-wrap gap-2">
            {TEAMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTeam(t)}
                aria-pressed={team === t}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  team === t
                    ? "border-2 border-vi-primary bg-vi-ice text-vi-primary"
                    : "border-vi-border text-vi-muted hover:border-vi-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Email (optional)">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="For follow-ups only"
            className="w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
          />
        </Field>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-[var(--radius-btn)] bg-vi-primary px-7 py-3 font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark disabled:opacity-60"
        >
          {busy ? "Starting…" : "Begin — 20 questions"}
        </button>
      </form>
    </Shell>
  );
}

function Shell({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="min-h-screen bg-white">
      <div
        className={`mx-auto px-6 py-10 sm:py-14 ${wide ? "max-w-2xl" : "max-w-xl"}`}
      >
        {children}
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="text-vi-primary"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "amber" | "grey";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        tone === "amber"
          ? "bg-vi-amber text-white"
          : "bg-vi-ice-deep text-vi-muted"
      }`}
    >
      {children}
    </span>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-vi-navy px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
    >
      {msg}
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense>
      <SurveyInner />
    </Suspense>
  );
}
