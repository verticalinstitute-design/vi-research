// File-backed store for local development (no Supabase env needed).
// Data lives in .data/db.json — gitignored, safe to delete to reset.
//
// All operations run through a single global mutex over an in-memory copy,
// and writes go to a temp file then rename, so concurrent autosave requests
// can never interleave reads with partial writes.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  Answer,
  AnswerPatch,
  NewResponse,
  Question,
  ResponseRow,
  Store,
} from "../types";
import { SEED_QUESTIONS } from "../seed";

type Db = {
  questions: Question[];
  responses: ResponseRow[];
  answers: Answer[];
};

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

// globalThis keeps one cache + mutex even if Next.js instantiates this module
// once per route bundle in dev.
type G = { gwDb?: Db; gwLock?: Promise<unknown> };
const g = globalThis as unknown as G;

async function loadDb(): Promise<Db> {
  if (g.gwDb) return g.gwDb;
  try {
    g.gwDb = JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db;
  } catch {
    const now = new Date().toISOString();
    g.gwDb = {
      questions: SEED_QUESTIONS.map((q, i) => ({
        id: randomUUID(),
        ...q,
        sort_order: i,
        is_active: true,
        created_at: now,
      })),
      responses: [],
      answers: [],
    };
    await persist(g.gwDb);
  }
  return g.gwDb;
}

async function persist(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

/** Runs fn with exclusive access to the db; persists after mutations. */
function withDb<T>(fn: (db: Db) => T | Promise<T>, mutate = true): Promise<T> {
  const run = async () => {
    const db = await loadDb();
    const result = await fn(db);
    if (mutate) await persist(db);
    return result;
  };
  const next = (g.gwLock ?? Promise.resolve()).then(run, run);
  g.gwLock = next.catch(() => {});
  return next;
}

export const localStore: Store = {
  listQuestions(activeOnly) {
    return withDb(
      (db) =>
        db.questions
          .filter((q) => (activeOnly ? q.is_active : true))
          .sort((a, b) => a.sort_order - b.sort_order),
      false
    );
  },

  createQuestion(q) {
    return withDb((db) => {
      const question: Question = {
        ...q,
        id: randomUUID(),
        created_at: new Date().toISOString(),
      };
      db.questions.push(question);
      return question;
    });
  },

  updateQuestion(id, patch) {
    return withDb((db) => {
      const q = db.questions.find((x) => x.id === id);
      if (!q) return null;
      Object.assign(q, patch, { id: q.id, created_at: q.created_at });
      return q;
    });
  },

  deleteQuestion(id) {
    return withDb((db) => {
      const q = db.questions.find((x) => x.id === id);
      if (!q) return { deleted: false, deactivated: false };
      const hasAnswers = db.answers.some(
        (a) => a.question_id === id && (a.body.trim() !== "" || a.is_unsure)
      );
      if (hasAnswers) {
        q.is_active = false;
        return { deleted: false, deactivated: true };
      }
      db.questions = db.questions.filter((x) => x.id !== id);
      db.answers = db.answers.filter((a) => a.question_id !== id);
      return { deleted: true, deactivated: false };
    });
  },

  reorderQuestions(orderedIds) {
    return withDb((db) => {
      orderedIds.forEach((id, i) => {
        const q = db.questions.find((x) => x.id === id);
        if (q) q.sort_order = i;
      });
    });
  },

  createResponse(data: NewResponse) {
    return withDb((db) => {
      const now = new Date().toISOString();
      const response: ResponseRow = {
        id: randomUUID(),
        mode: data.mode,
        name: data.name,
        role: data.role,
        team: data.team,
        email: data.email ?? "",
        session_name: data.session_name ?? null,
        session_date: data.session_date ?? null,
        attendees: data.attendees ?? [],
        resume_token: randomUUID(),
        status: "in_progress",
        created_at: now,
        submitted_at: null,
      };
      db.responses.push(response);
      return response;
    });
  },

  getResponseByToken(token) {
    return withDb((db) => {
      const response = db.responses.find((r) => r.resume_token === token);
      if (!response) return null;
      const answers = db.answers.filter((a) => a.response_id === response.id);
      return { response, answers };
    }, false);
  },

  updateResponseByToken(token, patch) {
    return withDb((db) => {
      const r = db.responses.find((x) => x.resume_token === token);
      if (!r) return null;
      Object.assign(r, patch, { id: r.id, resume_token: r.resume_token });
      return r;
    });
  },

  upsertAnswer(responseId, questionId, patch: AnswerPatch) {
    return withDb((db) => {
      let a = db.answers.find(
        (x) => x.response_id === responseId && x.question_id === questionId
      );
      if (!a) {
        a = {
          id: randomUUID(),
          response_id: responseId,
          question_id: questionId,
          body: "",
          is_unsure: false,
          is_skipped: false,
          speaker: null,
          covered: false,
          updated_at: new Date().toISOString(),
        };
        db.answers.push(a);
      }
      Object.assign(a, patch, { updated_at: new Date().toISOString() });
      return a;
    });
  },

  listResponses() {
    return withDb(
      (db) =>
        [...db.responses].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      false
    );
  },

  listAllAnswers() {
    return withDb((db) => db.answers, false);
  },

  deleteResponse(id) {
    return withDb((db) => {
      const existed = db.responses.some((r) => r.id === id);
      if (!existed) return false;
      db.responses = db.responses.filter((r) => r.id !== id);
      db.answers = db.answers.filter((a) => a.response_id !== id);
      return true;
    });
  },
};
