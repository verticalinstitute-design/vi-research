"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { api } from "@/lib/client";
import type { AdminData } from "./page";

type Form = {
  code: string;
  theme: string;
  prompt: string;
  helper: string;
  sources: string;
};

const EMPTY_FORM: Form = { code: "", theme: "", prompt: "", helper: "", sources: "" };

export default function QuestionsTab({
  data,
  reload,
}: {
  data: AdminData;
  reload: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<Question[] | null>(null);

  const serverOrder = [...data.questions].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  // While dragging (or just after a drop, before reload() lands) the list
  // shows the optimistic local order instead of snapping back to the
  // server's — otherwise every reorder flickers.
  const questions = localOrder ?? serverOrder;
  const answerCount = (qid: string) =>
    data.answers.filter((a) => a.question_id === qid && a.body.trim()).length;

  const persistOrder = async (ordered: Question[]) => {
    setLocalOrder(ordered);
    try {
      await api("/api/admin/questions/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: ordered.map((q) => q.id) }),
      });
      await reload();
    } catch {
      setNotice("Couldn't save the new order. Reloading.");
      await reload();
    } finally {
      setLocalOrder(null);
    }
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const from = questions.findIndex((q) => q.id === dragId);
    const to = questions.findIndex((q) => q.id === targetId);
    const reordered = [...questions];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setDragId(null);
    setOverId(null);
    persistOrder(reordered);
  };

  const startEdit = (q: Question) => {
    setAdding(false);
    setEditingId(q.id);
    setForm({
      code: q.code,
      theme: q.theme,
      prompt: q.prompt,
      helper: q.helper,
      sources: q.source_refs.join(", "),
    });
  };

  const save = async () => {
    setBusy(true);
    const payload = {
      code: form.code.trim(),
      theme: form.theme.trim(),
      prompt: form.prompt.trim(),
      helper: form.helper.trim(),
      source_refs: form.sources
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editingId) {
        await api(`/api/admin/questions/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/questions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingId(null);
      setAdding(false);
      setForm(EMPTY_FORM);
      await reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (q: Question) => {
    await api(`/api/admin/questions/${q.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !q.is_active }),
    });
    await reload();
  };

  const remove = async (q: Question) => {
    const n = answerCount(q.id);
    const msg = n
      ? `"${q.code}" has ${n} answer(s), so it will be deactivated (hidden from new responses) instead of deleted. Continue?`
      : `Delete "${q.code}" permanently?`;
    if (!confirm(msg)) return;
    const result = await api<{ deleted: boolean; deactivated: boolean }>(
      `/api/admin/questions/${q.id}`,
      { method: "DELETE" }
    );
    setNotice(
      result.deleted
        ? `${q.code} deleted.`
        : `${q.code} deactivated. Its existing answers are preserved.`
    );
    await reload();
  };

  const moveBy = (q: Question, dir: -1 | 1) => {
    const i = questions.findIndex((x) => x.id === q.id);
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const reordered = [...questions];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    persistOrder(reordered);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-vi-muted">
          {questions.length} questions · drag <span aria-hidden>⠿</span> to
          reorder · changes apply to new and in-progress responses
          immediately
        </p>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setAdding(true);
          }}
          className="rounded-[var(--radius-btn)] bg-vi-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-vi-primary-dark"
        >
          + Add question
        </button>
      </div>
      {notice && (
        <p className="mb-3 rounded-lg bg-vi-ice px-4 py-2 text-sm font-semibold">
          {notice}
        </p>
      )}

      {(adding || editingId) && (
        <div className="mb-5 rounded-2xl border-2 border-vi-primary bg-white p-5">
          <h3 className="font-heading text-base font-bold">
            {editingId ? "Edit question" : "New question"}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-[100px_1fr]">
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Code"
              className="rounded-lg border border-vi-border px-3 py-2 text-sm"
            />
            <input
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              placeholder="Theme, e.g. A · The buyer & the journey"
              list="themes"
              className="rounded-lg border border-vi-border px-3 py-2 text-sm"
            />
            <datalist id="themes">
              {[...new Set(questions.map((q) => q.theme))].map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <textarea
            value={form.prompt}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            placeholder="Question prompt (as shown to respondents)"
            rows={2}
            className="mt-3 w-full rounded-lg border border-vi-border px-3 py-2 text-sm"
          />
          <textarea
            value={form.helper}
            onChange={(e) => setForm({ ...form, helper: e.target.value })}
            placeholder='Helper: "why we&apos;re asking"'
            rows={2}
            className="mt-3 w-full rounded-lg border border-vi-border px-3 py-2 text-sm"
          />
          <input
            value={form.sources}
            onChange={(e) => setForm({ ...form, sources: e.target.value })}
            placeholder="Source refs, comma-separated (e.g. S3, Q5)"
            className="mt-3 w-full rounded-lg border border-vi-border px-3 py-2 text-sm"
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={save}
              disabled={busy || !form.prompt.trim()}
              className="rounded-[var(--radius-btn)] bg-vi-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-vi-primary-dark disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setEditingId(null);
              }}
              className="text-sm font-semibold text-vi-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {questions.map((q, i) => (
          <li
            key={q.id}
            onDragOver={(e) => {
              if (!dragId || dragId === q.id) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overId !== q.id) setOverId(q.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              dropOn(q.id);
            }}
            className={`rounded-xl border bg-white p-4 transition ${
              q.is_active ? "border-vi-border" : "border-dashed border-vi-border opacity-60"
            } ${dragId === q.id ? "opacity-40" : ""} ${
              overId === q.id && dragId && dragId !== q.id
                ? "border-vi-primary ring-2 ring-vi-primary/30"
                : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <span
                  draggable
                  onDragStart={(e) => {
                    setDragId(q.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  aria-hidden="true"
                  title="Drag to reorder"
                  className="cursor-grab select-none rounded px-1 py-0.5 text-base leading-none text-vi-muted hover:bg-vi-ice hover:text-vi-text active:cursor-grabbing"
                >
                  ⠿
                </span>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveBy(q, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${q.code} up`}
                    className="rounded px-1 text-[10px] text-vi-muted hover:text-vi-primary disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveBy(q, 1)}
                    disabled={i === questions.length - 1}
                    aria-label={`Move ${q.code} down`}
                    className="rounded px-1 text-[10px] text-vi-muted hover:text-vi-primary disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading font-bold text-vi-primary">
                    {q.code}
                  </span>
                  <span className="text-xs text-vi-muted">{q.theme}</span>
                  {q.source_refs.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-vi-ice px-2 py-0.5 text-[11px] font-bold text-vi-muted"
                    >
                      {s}
                    </span>
                  ))}
                  {!q.is_active && (
                    <span className="rounded-full bg-vi-ice-deep px-2 py-0.5 text-[11px] font-bold uppercase text-vi-muted">
                      Inactive
                    </span>
                  )}
                  <span className="ml-auto text-xs text-vi-muted">
                    {answerCount(q.id)} answers
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium">{q.prompt}</p>
                {q.helper && (
                  <p className="mt-0.5 text-xs text-vi-muted">{q.helper}</p>
                )}
                <div className="mt-2 flex gap-4 text-xs font-semibold">
                  <button
                    onClick={() => startEdit(q)}
                    className="text-vi-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(q)}
                    className="text-vi-muted hover:text-vi-text"
                  >
                    {q.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                  <button
                    onClick={() => remove(q)}
                    className="text-red-600/80 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
