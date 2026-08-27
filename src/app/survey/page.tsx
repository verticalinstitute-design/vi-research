"use client";

// Respondent wizard — "Focus stage" treatment: every phase composes into a
// fixed, non-scrollable viewport with the focal content centered; chrome
// (progress, wayfinding, utilities) lives at the viewport edges.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ContactTag } from "@/components/ContactTag";
import type { Question, ResponseRow } from "@/lib/types";
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

type Draft = { body: string; is_skipped: boolean };

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
                return !d || (!d.body.trim() && !d.is_skipped);
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
          showToast("Couldn't save. Check your connection.")
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
  };

  const next = () => {
    if (!question) return;
    if (draft.body.trim() && draft.is_skipped) updateDraft({ is_skipped: false });
    if (index + 1 >= questions.length) goTo(index, "review");
    else goTo(index + 1);
  };

  const skip = () => {
    updateDraft({ is_skipped: true });
    if (question && token) {
      saveAnswer(token, question.id, { ...draft, is_skipped: true }).catch(() => {});
    }
    if (index + 1 >= questions.length) {
      setIndex(index);
      setPhase("review");
    } else {
      setIndex(index + 1);
    }
  };

  const copyResumeLink = async () => {
    const url = `${location.origin}/survey?r=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Resume link copied. Open it on any device to continue.");
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
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Submit failed. Try again.");
    }
  };

  const startFresh = () => {
    localStorage.removeItem(TOKEN_KEY);
    location.href = "/survey";
  };

  // ------- screens -------

  if (error) {
    return (
      <Stage>
        <div className="text-center">
          <p className="text-vi-muted">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block font-semibold text-vi-primary"
          >
            ← Back to start
          </Link>
        </div>
      </Stage>
    );
  }

  if (phase === "loading") {
    return (
      <Stage>
        <p className="text-vi-muted">Loading…</p>
      </Stage>
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
      <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-vi-navy px-6">
        <div className="flex max-w-xl flex-col items-center text-center text-white">
          <h1 className="text-4xl">
            Thank you{response ? `, ${response.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-4 text-white/80">
            Your responses are valuable. They help us improve the website.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
          <div className="mt-10 w-full max-w-xs border-t border-white/10 pt-8">
            <ContactTag tone="dark" />
          </div>
        </div>
      </main>
    );
  }

  if (phase === "review") {
    const answered = questions.filter((q) => drafts[q.id]?.body.trim()).length;
    return (
      <main className="flex h-dvh w-full flex-col overflow-hidden bg-vi-ice">
        <header className="px-6 pt-8 pb-4 text-center">
          <h1 className="text-3xl">
            {answered} of {questions.length} answered
          </h1>
          <p className="mt-1.5 text-sm text-vi-muted">
            Tap any question to edit. Skipped questions are fine to submit.
          </p>
        </header>
        <div className="flex justify-center pb-3">
          <ContactTag />
        </div>
        <ul className="mx-auto w-full max-w-2xl flex-1 space-y-2 overflow-y-auto px-6 pb-4 [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)] [scrollbar-color:var(--color-vi-ice-deep)_transparent]">
          {questions.map((q, i) => {
            const d = drafts[q.id];
            return (
              <li key={q.id} className="first:mt-3 last:mb-3">
                <button
                  onClick={() => goTo(i)}
                  className="w-full rounded-xl border border-transparent bg-white p-4 text-left shadow-[0_4px_14px_rgba(20,30,77,0.06)] transition hover:border-vi-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-heading text-sm font-bold text-vi-primary">
                      {q.code}
                    </span>
                    <span className="flex gap-1.5">
                      {!d?.body.trim() && d?.is_skipped && (
                        <Badge>Skipped</Badge>
                      )}
                      {!d?.body.trim() && !d?.is_skipped && (
                        <Badge>No answer</Badge>
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
        <footer className="border-t border-vi-border bg-white/90 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
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
        </footer>
        {toast && <Toast msg={toast} />}
      </main>
    );
  }

  // question phase — the Focus stage
  if (!question) return null;

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-vi-ice">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-vi-ice-deep"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
      >
        <div
          className="h-full bg-vi-primary transition-all duration-300"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <header className="flex items-baseline justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <p className="text-[13px] font-semibold text-vi-muted">
          {question.theme}
        </p>
        <p className="font-heading text-[13px] font-bold tabular-nums">
          {index + 1}
          <span className="text-vi-muted"> / {questions.length}</span>
        </p>
      </header>

      <section className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-5 sm:px-6">
        <div className="flex w-full max-w-[680px] flex-col items-center text-center">
          <h1 className="font-heading text-[clamp(21px,3.2vw,34px)] leading-[1.25] font-bold tracking-[-0.5px]">
            {question.prompt}
          </h1>
          <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-vi-muted">
            {question.helper}
          </p>

          <textarea
            value={draft.body}
            onChange={(e) => updateDraft({ body: e.target.value })}
            onBlur={() => flush(question.id)}
            placeholder="Type your answer, rough notes are perfect…"
            rows={6}
            autoFocus
            className="mt-6 w-full resize-none rounded-2xl border border-transparent bg-white p-5 text-left text-[15.5px] leading-relaxed caret-vi-primary shadow-[0_16px_40px_rgba(20,30,77,0.10)] transition placeholder:text-vi-muted/70 focus:border-vi-primary focus:outline-none sm:mt-8"
          />

          <div className="mt-4 flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-5">
              <button
                onClick={() => (index === 0 ? undefined : goTo(index - 1))}
                disabled={index === 0}
                className="text-[14px] font-semibold text-vi-muted transition hover:text-vi-text disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                onClick={skip}
                className="text-[14px] font-semibold text-vi-muted transition hover:text-vi-text"
              >
                Skip
              </button>
            </div>
            <button
              onClick={next}
              className="rounded-[var(--radius-btn)] bg-vi-primary px-7 py-3 text-[15px] font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark"
            >
              {index + 1 === questions.length ? "Review answers" : "Next →"}
            </button>
          </div>
        </div>
      </section>

      <footer className="relative flex items-center justify-center px-5 pb-5 sm:px-8 sm:pb-6">
        <ContactTag />
        <p className="absolute bottom-5 right-5 hidden text-[11px] text-vi-muted sm:right-8 sm:block">
          Autosaves as you type ·{" "}
          <button
            onClick={copyResumeLink}
            className="font-semibold text-vi-primary"
          >
            Continue later
          </button>
        </p>
      </footer>
      {toast && <Toast msg={toast} />}
    </main>
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
    <Stage>
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl">Who&apos;s answering?</h1>
          <p className="mx-auto mt-2 max-w-[42ch] text-sm text-vi-muted">
            A few details so we know who to follow up with if we need more
            context.
          </p>
        </div>
        <form onSubmit={start} className="mt-7 space-y-4">
          <Field label="Full name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-xl border border-transparent bg-white p-3 shadow-[0_4px_14px_rgba(20,30,77,0.06)] transition focus:border-vi-primary focus:outline-none"
            />
          </Field>
          <Field label="Role / title" required>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              placeholder="Corporate Solutions Manager"
              className="w-full rounded-xl border border-transparent bg-white p-3 shadow-[0_4px_14px_rgba(20,30,77,0.06)] transition placeholder:text-vi-muted/70 focus:border-vi-primary focus:outline-none"
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
                      ? "border-2 border-vi-primary bg-white text-vi-primary"
                      : "border-vi-border bg-white/60 text-vi-muted hover:border-vi-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@verticalinstitute.com"
              className="w-full rounded-xl border border-transparent bg-white p-3 shadow-[0_4px_14px_rgba(20,30,77,0.06)] transition placeholder:text-vi-muted/70 focus:border-vi-primary focus:outline-none"
            />
          </Field>
          {error && (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-[var(--radius-btn)] bg-vi-primary px-7 py-3 font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark disabled:opacity-60"
          >
            {busy ? "Starting…" : "Begin"}
          </button>
        </form>
      </div>
    </Stage>
  );
}

/** Fixed-viewport centered stage on the ice ground. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center gap-7 overflow-hidden bg-vi-ice px-6 py-6">
      {children}
      <ContactTag />
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
    <label className="block text-left">
      <span className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="text-vi-primary"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-vi-ice-deep px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-vi-muted">
      {children}
    </span>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-vi-navy px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
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
