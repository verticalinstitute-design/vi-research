// Small client-side fetch helpers shared by the wizard, live console, and admin.
import type { Answer, Question, ResponseRow } from "./types";

export async function api<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export type ResponseData = { response: ResponseRow; answers: Answer[] };
export type QuestionsData = { questions: Question[] };

export function saveAnswer(
  token: string,
  questionId: string,
  patch: Record<string, unknown>
) {
  return api<{ answer: Answer }>(`/api/responses/${token}`, {
    method: "PATCH",
    body: JSON.stringify({ answer: { question_id: questionId, ...patch } }),
  });
}

/** Debounce helper keyed by an id, so rapid typing produces one save. */
export function makeDebouncer(delay = 700) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  return (key: string, fn: () => void) => {
    const existing = timers.get(key);
    if (existing) clearTimeout(existing);
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        fn();
      }, delay)
    );
  };
}

export const TEAMS = ["BD", "Sales", "Marketing", "Leadership", "Other"];
