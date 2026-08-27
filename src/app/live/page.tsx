"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ContactTag } from "@/components/ContactTag";
import type { Question, ResponseRow } from "@/lib/types";
import {
  api,
  makeDebouncer,
  saveAnswer,
  type QuestionsData,
  type ResponseData,
} from "@/lib/client";

const TOKEN_KEY = "gw_live_token";

type Draft = {
  body: string;
  covered: boolean;
  is_skipped: boolean;
  speaker: string;
};

const EMPTY: Draft = {
  body: "",
  covered: false,
  is_skipped: false,
  speaker: "",
};

export default function LivePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [response, setResponse] = useState<ResponseRow | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const debounce = useMemo(() => makeDebouncer(600), []);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  useEffect(() => {
    (async () => {
      const { questions } = await api<QuestionsData>("/api/questions");
      setQuestions(questions);
      if (questions.length) setActiveId(questions[0].id);
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const data = await api<ResponseData>(`/api/responses/${token}`);
          if (data.response.mode === "live" && data.response.status === "in_progress") {
            setResponse(data.response);
            const map: Record<string, Draft> = {};
            for (const a of data.answers) {
              map[a.question_id] = {
                body: a.body,
                covered: a.covered,
                is_skipped: a.is_skipped,
                speaker: a.speaker ?? "",
              };
            }
            setDrafts(map);
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    })();
  }, []);

  const token = response?.resume_token ?? "";
  const active = questions.find((q) => q.id === activeId);
  const draft = (active && drafts[active.id]) || EMPTY;

  const update = (qid: string, patch: Partial<Draft>) => {
    const next = { ...(draftsRef.current[qid] || EMPTY), ...patch };
    setDrafts((d) => ({ ...d, [qid]: next }));
    debounce(qid, () => {
      const latest = draftsRef.current[qid];
      if (latest && token) {
        saveAnswer(token, qid, {
          body: latest.body,
          covered: latest.covered,
          is_skipped: latest.is_skipped,
          speaker: latest.speaker || null,
        }).catch(() => {});
      }
    });
  };

  const move = (dir: 1 | -1) => {
    const i = questions.findIndex((q) => q.id === activeId);
    const next = questions[i + dir];
    if (next) setActiveId(next.id);
  };

  const endSession = async () => {
    if (!token) return;
    if (!confirm("End and submit this session? You can't edit it afterwards.")) return;
    await api(`/api/responses/${token}`, {
      method: "PATCH",
      body: JSON.stringify({ submit: true }),
    });
    localStorage.removeItem(TOKEN_KEY);
    setResponse(null);
    setDrafts({});
    alert("Session submitted. Answers are in the admin console.");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-vi-ice">
        <p className="text-vi-muted">Loading…</p>
      </main>
    );
  }

  if (!response) {
    return (
      <SessionSetup
        onCreated={(r) => {
          localStorage.setItem(TOKEN_KEY, r.resume_token);
          setResponse(r);
        }}
      />
    );
  }

  const themes = [...new Set(questions.map((q) => q.theme))];
  const covered = questions.filter(
    (q) => drafts[q.id]?.covered || drafts[q.id]?.body.trim()
  ).length;

  return (
    <main className="min-h-screen bg-vi-ice">
      <header className="sticky top-0 z-10 border-b border-vi-border bg-white px-5 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-vi-primary">Live session</p>
            <h1 className="font-heading text-lg font-bold leading-tight">
              {response.session_name || "BD/Sales session"}
              <span className="ml-2 text-sm font-normal text-vi-muted">
                {covered}/{questions.length} covered
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-vi-muted sm:block">
              Autosaves live · ⌥↑/⌥↓ to move
            </p>
            <button
              onClick={endSession}
              className="rounded-[var(--radius-btn)] border-[1.5px] border-vi-border bg-white px-4 py-2 text-sm font-semibold transition hover:border-vi-primary"
            >
              End session
            </button>
          </div>
        </div>
      </header>

      <div
        className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[320px_1fr]"
        onKeyDown={(e) => {
          if (e.altKey && e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          }
          if (e.altKey && e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        <nav className="space-y-4 lg:sticky lg:top-[92px] lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto">
          {themes.map((theme) => (
            <div key={theme}>
              <p className="eyebrow mb-1.5 text-vi-muted">{theme}</p>
              <ul className="space-y-1">
                {questions
                  .filter((q) => q.theme === theme)
                  .map((q) => {
                    const d = drafts[q.id];
                    const status = d?.body.trim()
                      ? "notes"
                      : d?.covered
                        ? "covered"
                        : d?.is_skipped
                          ? "skipped"
                          : "untouched";
                    return (
                      <li key={q.id}>
                        <button
                          onClick={() => {
                            setActiveId(q.id);
                            if (window.innerWidth < 1024) {
                              document
                                .getElementById("live-editor")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] leading-snug transition ${
                            q.id === activeId
                              ? "border-2 border-vi-primary bg-white font-semibold"
                              : "border-vi-border bg-white/60 hover:bg-white"
                          }`}
                        >
                          <span
                            className={`size-2 shrink-0 rounded-full ${
                              status === "notes"
                                ? "bg-vi-green"
                                : status === "covered"
                                  ? "bg-vi-primary"
                                  : status === "skipped"
                                    ? "bg-vi-ice-deep"
                                    : "border border-vi-border bg-white"
                            }`}
                            aria-hidden
                          />
                          <span className="font-heading font-bold text-vi-primary">
                            {q.code}
                          </span>
                          <span className="line-clamp-2 text-vi-muted">
                            {q.prompt}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        {active && (
          <section
            id="live-editor"
            className="scroll-mt-24 rounded-2xl border border-vi-border bg-white p-6 shadow-[var(--shadow-card)]"
          >
            <p className="eyebrow text-vi-primary">{active.theme}</p>
            <h2 className="mt-2 text-xl leading-snug">
              <span className="mr-2 text-vi-primary">{active.code}</span>
              {active.prompt}
            </h2>
            <p className="mt-2 text-sm text-vi-muted">{active.helper}</p>

            <textarea
              value={draft.body}
              onChange={(e) => update(active.id, { body: e.target.value })}
              placeholder="Notes from the room: capture verbatims where you can…"
              rows={10}
              className="mt-4 w-full rounded-xl border border-vi-border p-4 text-[15px] leading-relaxed transition focus:border-vi-primary"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Speaker</span>
                <input
                  list="attendees"
                  value={draft.speaker}
                  onChange={(e) => update(active.id, { speaker: e.target.value })}
                  placeholder="optional"
                  className="w-44 rounded-lg border border-vi-border px-3 py-1.5 text-sm transition focus:border-vi-primary"
                />
                <datalist id="attendees">
                  {response.attendees.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </label>

              <Toggle
                on={draft.covered}
                onClick={() => update(active.id, { covered: !draft.covered })}
                activeClass="border-vi-primary bg-vi-ice"
              >
                ✓ Covered
              </Toggle>
              <Toggle
                on={draft.is_skipped}
                onClick={() => update(active.id, { is_skipped: !draft.is_skipped })}
                activeClass="border-vi-border bg-vi-ice-deep"
              >
                Skipped in session
              </Toggle>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-vi-border pt-4">
              <button
                onClick={() => move(-1)}
                className="text-sm font-semibold text-vi-muted transition hover:text-vi-text"
              >
                ← Previous
              </button>
              <button
                onClick={() => move(1)}
                className="rounded-[var(--radius-btn)] bg-vi-primary px-6 py-2.5 font-semibold text-white transition hover:bg-vi-primary-dark"
              >
                Next question →
              </button>
            </div>
          </section>
        )}
      </div>
      <div className="flex justify-center py-8">
        <ContactTag />
      </div>
    </main>
  );
}

function Toggle({
  on,
  onClick,
  activeClass,
  children,
}: {
  on: boolean;
  onClick: () => void;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        on ? `${activeClass} text-vi-text` : "border-vi-border text-vi-muted hover:border-vi-primary"
      }`}
    >
      {children}
    </button>
  );
}

function SessionSetup({ onCreated }: { onCreated: (r: ResponseRow) => void }) {
  const [sessionName, setSessionName] = useState("BD/Sales research session");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [name, setName] = useState("");
  const [role, setRole] = useState("UX / Design");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addAttendee = () => {
    const v = attendeeInput.trim();
    if (v && !attendees.includes(v)) setAttendees([...attendees, v]);
    setAttendeeInput("");
  };

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { response } = await api<{ response: ResponseRow }>(
        "/api/responses",
        {
          method: "POST",
          body: JSON.stringify({
            mode: "live",
            name,
            role,
            team: "UX",
            session_name: sessionName,
            session_date: date,
            attendees,
          }),
        }
      );
      onCreated(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-vi-ice">
      <div className="mx-auto max-w-xl px-6 py-14">
        <p className="eyebrow text-vi-primary">Facilitator console</p>
        <h1 className="mt-2 text-3xl">Set up the live session</h1>
        <p className="mt-2 text-vi-muted">
          All questions stay visible so you can jump around as the conversation
          moves. Notes autosave; tag speakers only when it matters.
        </p>
        <form
          onSubmit={start}
          className="mt-6 space-y-4 rounded-2xl border border-vi-border bg-white p-6 shadow-[var(--shadow-card)]"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Session name</span>
            <input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Facilitator name <span className="text-vi-primary">*</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Facilitator role</span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-sm font-semibold">
              Attendees <span className="font-normal text-vi-muted">(for speaker tags)</span>
            </span>
            <div className="flex gap-2">
              <input
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAttendee();
                  }
                }}
                placeholder="Name (press Enter to add)"
                className="w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
              />
              <button
                type="button"
                onClick={addAttendee}
                className="shrink-0 rounded-[var(--radius-btn)] border-[1.5px] border-vi-border px-4 font-semibold transition hover:border-vi-primary"
              >
                Add
              </button>
            </div>
            {attendees.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {attendees.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 rounded-full bg-vi-ice px-3 py-1 text-sm font-semibold"
                  >
                    {a}
                    <button
                      type="button"
                      aria-label={`Remove ${a}`}
                      onClick={() =>
                        setAttendees(attendees.filter((x) => x !== a))
                      }
                      className="text-vi-muted hover:text-vi-text"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-[var(--radius-btn)] bg-vi-primary px-7 py-3 font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark disabled:opacity-60"
          >
            {busy ? "Starting…" : "Start session"}
          </button>
        </form>
        <p className="mt-6 text-xs text-vi-muted">
          <Link href="/" className="font-semibold text-vi-primary">
            ← Back to start
          </Link>
        </p>
        <div className="mt-10 flex justify-center">
          <ContactTag />
        </div>
      </div>
    </main>
  );
}
