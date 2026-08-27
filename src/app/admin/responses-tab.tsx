"use client";

import { useState } from "react";
import type { ResponseRow } from "@/lib/types";
import { api } from "@/lib/client";
import type { AdminData } from "./page";

export default function ResponsesTab({
  data,
  reload,
}: {
  data: AdminData;
  reload: () => Promise<void>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const questions = [...data.questions].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const progress = (r: ResponseRow) => {
    const active = questions.filter((q) => q.is_active);
    const answered = active.filter((q) =>
      data.answers.some(
        (a) =>
          a.response_id === r.id && a.question_id === q.id && a.body.trim()
      )
    ).length;
    return { answered, total: active.length };
  };

  const remove = async (r: ResponseRow) => {
    const label = r.mode === "live" ? r.session_name || "Live session" : r.name;
    if (
      !confirm(
        `Permanently delete "${label}"'s response? This can't be undone.`
      )
    )
      return;
    setBusyId(r.id);
    try {
      await api(`/api/admin/responses/${r.id}`, { method: "DELETE" });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (data.responses.length === 0) {
    return (
      <div className="rounded-2xl border border-vi-border bg-white p-10 text-center">
        <h3 className="font-heading text-lg font-bold">No responses yet</h3>
        <p className="mt-1 text-sm text-vi-muted">
          Share the survey link with BD/Sales, or run a live session from the
          facilitator console.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {data.responses.map((r) => {
        const p = progress(r);
        const open = openId === r.id;
        return (
          <li key={r.id} className="rounded-xl border border-vi-border bg-white">
            <div className="flex w-full flex-wrap items-center gap-3 p-4">
              <button
                onClick={() => setOpenId(open ? null : r.id)}
                className="flex flex-1 flex-wrap items-center gap-3 text-left"
              >
                <span
                  className={`size-2.5 shrink-0 rounded-full ${
                    r.status === "submitted" ? "bg-vi-green" : "bg-vi-amber"
                  }`}
                  title={r.status}
                />
                <span className="font-semibold">
                  {r.mode === "live" ? r.session_name || "Live session" : r.name}
                </span>
                <span className="text-sm text-vi-muted">
                  {r.mode === "live"
                    ? `facilitated by ${r.name} · ${r.attendees.length} attendees`
                    : `${r.role}${r.team ? ` · ${r.team}` : ""}`}
                </span>
              </button>
              <span className="flex items-center gap-3 text-xs text-vi-muted">
                <span className="rounded-full bg-vi-ice px-2.5 py-0.5 font-bold uppercase">
                  {r.mode}
                </span>
                <span>
                  {p.answered}/{p.total} answered
                </span>
                <span>{new Date(r.created_at).toLocaleDateString("en-SG")}</span>
                <button
                  onClick={() => remove(r)}
                  disabled={busyId === r.id}
                  className="font-semibold text-red-600/80 transition hover:text-red-600 disabled:opacity-40"
                >
                  {busyId === r.id ? "Deleting…" : "Delete"}
                </button>
                <button
                  onClick={() => setOpenId(open ? null : r.id)}
                  aria-label={open ? "Collapse" : "Expand"}
                  aria-hidden="true"
                  className="text-vi-muted"
                >
                  {open ? "▴" : "▾"}
                </button>
              </span>
            </div>
            {open && (
              <div className="border-t border-vi-border px-4 py-4">
                {r.mode === "live" && r.attendees.length > 0 && (
                  <p className="mb-3 text-sm text-vi-muted">
                    <span className="font-semibold text-vi-text">Attendees:</span>{" "}
                    {r.attendees.join(", ")}
                  </p>
                )}
                <dl className="space-y-4">
                  {questions.map((q) => {
                    const a = data.answers.find(
                      (x) => x.response_id === r.id && x.question_id === q.id
                    );
                    if (!a || (!a.body.trim() && !a.is_skipped)) return null;
                    return (
                      <div key={q.id}>
                        <dt className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {q.prompt}
                          {a.is_skipped && !a.body.trim() && (
                            <span className="rounded-full bg-vi-ice-deep px-2 py-0.5 text-[10px] font-bold uppercase text-vi-muted">
                              Skipped
                            </span>
                          )}
                          {a.speaker && (
                            <span className="text-xs font-normal text-vi-muted">
                              · {a.speaker}
                            </span>
                          )}
                        </dt>
                        {a.body.trim() && (
                          <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-vi-ice px-3.5 py-2.5 text-sm">
                            {a.body}
                          </dd>
                        )}
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
