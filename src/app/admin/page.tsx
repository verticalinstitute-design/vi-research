"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Answer, Question, ResponseRow } from "@/lib/types";
import { api } from "@/lib/client";
import QuestionsTab from "./questions-tab";
import ResponsesTab from "./responses-tab";
import SynthesisTab from "./synthesis-tab";

export type AdminData = {
  responses: ResponseRow[];
  answers: Answer[];
  questions: Question[];
};

const TABS = ["Synthesis", "Responses", "Questions"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("Synthesis");
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const d = await api<AdminData>("/api/admin/responses");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { admin } = await api<{ admin: boolean }>("/api/admin/login");
      setAuthed(admin);
      if (admin) reload();
    })();
  }, [reload]);

  if (authed === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-vi-ice">
        <p className="text-vi-muted">Loading…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <Login
        onSuccess={() => {
          setAuthed(true);
          reload();
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-vi-ice">
      <header className="border-b border-vi-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="eyebrow text-vi-primary">VI Research Platform · Admin</p>
            <h1 className="font-heading text-xl font-bold">
              B2B research console
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/live"
              className="mr-2 rounded-[var(--radius-btn)] border-[1.5px] border-vi-border bg-white px-3.5 py-1.5 text-sm font-semibold transition hover:border-vi-primary"
            >
              Facilitator console
            </Link>
            <span className="mr-1 text-xs font-semibold text-vi-muted">
              Export
            </span>
            {(["csv", "xlsx", "md"] as const).map((f) => (
              <a
                key={f}
                href={`/api/admin/export?format=${f}`}
                className="rounded-[var(--radius-btn)] border-[1.5px] border-vi-border bg-white px-3.5 py-1.5 text-sm font-semibold uppercase transition hover:border-vi-primary"
              >
                {f}
              </a>
            ))}
            <button
              onClick={async () => {
                await api("/api/admin/login", { method: "DELETE" });
                setAuthed(false);
              }}
              className="ml-2 text-sm font-semibold text-vi-muted hover:text-vi-text"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-current={tab === t}
              className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                tab === t
                  ? "border-vi-primary text-vi-primary"
                  : "border-transparent text-vi-muted hover:text-vi-text"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6">
        {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}
        {!data ? (
          <p className="text-vi-muted">Loading data…</p>
        ) : tab === "Synthesis" ? (
          <SynthesisTab data={data} />
        ) : tab === "Responses" ? (
          <ResponsesTab data={data} />
        ) : (
          <QuestionsTab data={data} reload={reload} />
        )}
      </div>
    </main>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ passcode }),
      });
      onSuccess();
    } catch {
      setError("Wrong passcode.");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-vi-navy px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-[var(--shadow-card)]"
      >
        <p className="eyebrow text-vi-primary">VI Research Platform · Admin</p>
        <h1 className="mt-2 text-2xl">UX team access</h1>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Team passcode"
          autoFocus
          className="mt-4 w-full rounded-xl border border-vi-border p-3 transition focus:border-vi-primary"
        />
        {error && (
          <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-[var(--radius-btn)] bg-vi-primary px-6 py-3 font-semibold text-white transition hover:bg-vi-primary-dark disabled:opacity-60"
        >
          Enter
        </button>
        <p className="mt-4 text-center text-xs text-vi-muted">
          <Link href="/" className="font-semibold text-vi-primary">
            ← Back to the survey
          </Link>
        </p>
      </form>
    </main>
  );
}
