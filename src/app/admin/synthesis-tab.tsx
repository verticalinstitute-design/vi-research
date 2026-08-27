"use client";

import { useState } from "react";
import type { ResponseRow } from "@/lib/types";
import type { AdminData } from "./page";

function respondentLabel(r: ResponseRow) {
  return r.mode === "live"
    ? `${r.session_name || "Live session"} · ${r.name}`
    : `${r.name} · ${r.role}${r.team ? `, ${r.team}` : ""}`;
}

export default function SynthesisTab({ data }: { data: AdminData }) {
  const questions = [...data.questions]
    .filter((q) => q.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const [selectedId, setSelectedId] = useState<string>(questions[0]?.id ?? "");

  const answersFor = (qid: string) =>
    data.answers.filter((a) => a.question_id === qid && a.body.trim());

  const submitted = data.responses.filter((r) => r.status === "submitted");
  const maxCoverage = Math.max(
    1,
    ...questions.map((q) => answersFor(q.id).length)
  );

  const selected = questions.find((q) => q.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Responses started" value={data.responses.length} />
        <Stat label="Submitted" value={submitted.length} />
      </div>

      {/* Coverage chart */}
      <section className="rounded-2xl border border-vi-border bg-white p-5">
        <h3 className="font-heading text-base font-bold">
          Answer coverage by question
        </h3>
        <ul className="mt-3 space-y-1.5">
          {questions.map((q) => {
            const n = answersFor(q.id).length;
            return (
              <li key={q.id} className="flex items-center gap-3 text-sm">
                <button
                  onClick={() => setSelectedId(q.id)}
                  className="w-9 shrink-0 text-left font-heading font-bold text-vi-primary hover:underline"
                >
                  {q.code}
                </button>
                <div className="h-4 flex-1 overflow-hidden rounded bg-vi-ice">
                  <div
                    className="h-full rounded bg-vi-primary"
                    style={{ width: `${(n / maxCoverage) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs tabular-nums text-vi-muted">
                  {n} ans
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* By-question reading view */}
      <section className="rounded-2xl border border-vi-border bg-white p-5">
        <h3 className="font-heading text-base font-bold">Read by question</h3>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="mt-3 w-full rounded-xl border border-vi-border p-3 text-sm font-medium"
        >
          {questions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.code} · {q.prompt}
            </option>
          ))}
        </select>
        {selected && (
          <div className="mt-4">
            <p className="rounded-xl bg-vi-ice px-4 py-3 text-sm text-vi-muted">
              <span className="font-semibold text-vi-text">Why we asked: </span>
              {selected.helper}
              <span className="ml-2 text-xs">
                ({selected.source_refs.join(", ")})
              </span>
            </p>
            <div className="mt-4 space-y-3">
              {answersFor(selected.id).length === 0 && (
                <p className="text-sm text-vi-muted">No answers yet.</p>
              )}
              {answersFor(selected.id).map((a) => {
                const r = data.responses.find((x) => x.id === a.response_id);
                if (!r) return null;
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-vi-border p-4"
                  >
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {respondentLabel(r)}
                      <span className="rounded-full bg-vi-ice px-2 py-0.5 text-[10px] font-bold uppercase text-vi-muted">
                        {r.mode}
                      </span>
                      {a.speaker && (
                        <span className="text-xs font-normal text-vi-muted">
                          speaker: {a.speaker}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {a.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-vi-border bg-white p-4">
      <p className="font-heading text-2xl font-bold tabular-nums text-vi-text">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-vi-muted">
        {label}
      </p>
    </div>
  );
}
