// Supabase driver — used in production when SUPABASE_URL + SUPABASE_SERVICE_KEY
// are set. All access is server-side with the service key; RLS stays closed.
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  Answer,
  AnswerPatch,
  NewResponse,
  Question,
  ResponseRow,
  Store,
} from "../types";
import { SEED_QUESTIONS } from "../seed";

let client: SupabaseClient | null = null;
let seeded = false;

function sb(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return client;
}

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// Seeds the question set on first use of an empty database.
async function ensureSeeded() {
  if (seeded) return;
  const { count, error } = await sb()
    .from("questions")
    .select("id", { count: "exact", head: true });
  throwIf(error);
  if ((count ?? 0) === 0) {
    const { error: insError } = await sb().from("questions").insert(
      SEED_QUESTIONS.map((q, i) => ({ ...q, sort_order: i, is_active: true }))
    );
    throwIf(insError);
  }
  seeded = true;
}

export const supabaseStore: Store = {
  async listQuestions(activeOnly) {
    await ensureSeeded();
    let q = sb().from("questions").select("*").order("sort_order");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    throwIf(error);
    return (data ?? []) as Question[];
  },

  async createQuestion(question) {
    const { data, error } = await sb()
      .from("questions")
      .insert(question)
      .select()
      .single();
    throwIf(error);
    return data as Question;
  },

  async updateQuestion(id, patch) {
    const { data, error } = await sb()
      .from("questions")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();
    throwIf(error);
    return (data as Question) ?? null;
  },

  async deleteQuestion(id) {
    const { count, error: countError } = await sb()
      .from("answers")
      .select("id", { count: "exact", head: true })
      .eq("question_id", id)
      .or("body.neq.,is_unsure.eq.true");
    throwIf(countError);
    if ((count ?? 0) > 0) {
      const { error } = await sb()
        .from("questions")
        .update({ is_active: false })
        .eq("id", id);
      throwIf(error);
      return { deleted: false, deactivated: true };
    }
    const { error: delAnswers } = await sb()
      .from("answers")
      .delete()
      .eq("question_id", id);
    throwIf(delAnswers);
    const { error } = await sb().from("questions").delete().eq("id", id);
    throwIf(error);
    return { deleted: true, deactivated: false };
  },

  async reorderQuestions(orderedIds) {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await sb()
        .from("questions")
        .update({ sort_order: i })
        .eq("id", orderedIds[i]);
      throwIf(error);
    }
  },

  async createResponse(data: NewResponse) {
    const { data: row, error } = await sb()
      .from("responses")
      .insert({
        mode: data.mode,
        name: data.name,
        role: data.role,
        team: data.team,
        email: data.email ?? "",
        session_name: data.session_name ?? null,
        session_date: data.session_date ?? null,
        attendees: data.attendees ?? [],
      })
      .select()
      .single();
    throwIf(error);
    return row as ResponseRow;
  },

  async getResponseByToken(token) {
    const { data: response, error } = await sb()
      .from("responses")
      .select("*")
      .eq("resume_token", token)
      .maybeSingle();
    throwIf(error);
    if (!response) return null;
    const { data: answers, error: aError } = await sb()
      .from("answers")
      .select("*")
      .eq("response_id", response.id);
    throwIf(aError);
    return {
      response: response as ResponseRow,
      answers: (answers ?? []) as Answer[],
    };
  },

  async updateResponseByToken(token, patch) {
    const { data, error } = await sb()
      .from("responses")
      .update(patch)
      .eq("resume_token", token)
      .select()
      .maybeSingle();
    throwIf(error);
    return (data as ResponseRow) ?? null;
  },

  async upsertAnswer(responseId, questionId, patch: AnswerPatch) {
    // Atomic upsert (ON CONFLICT DO UPDATE) instead of select-then-branch:
    // concurrent autosave requests for the same (response_id, question_id)
    // would otherwise both see "no row" and race on INSERT, one hitting the
    // unique constraint and 500ing.
    const { data, error } = await sb()
      .from("answers")
      .upsert(
        {
          response_id: responseId,
          question_id: questionId,
          ...patch,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "response_id,question_id" }
      )
      .select()
      .single();
    throwIf(error);
    return data as Answer;
  },

  async listResponses() {
    const { data, error } = await sb()
      .from("responses")
      .select("*")
      .order("created_at", { ascending: false });
    throwIf(error);
    return (data ?? []) as ResponseRow[];
  },

  async listAllAnswers() {
    const { data, error } = await sb().from("answers").select("*");
    throwIf(error);
    return (data ?? []) as Answer[];
  },
};
