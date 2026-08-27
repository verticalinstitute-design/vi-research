export type Question = {
  id: string;
  code: string; // e.g. "A1"
  theme: string; // e.g. "A · The buyer & the journey"
  prompt: string;
  helper: string; // "why we're asking"
  source_refs: string[]; // e.g. ["S1","Q1"]
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type ResponseMode = "async" | "live";
export type ResponseStatus = "in_progress" | "submitted";

export type ResponseRow = {
  id: string;
  mode: ResponseMode;
  name: string;
  role: string;
  team: string;
  email: string;
  session_name: string | null;
  session_date: string | null;
  attendees: string[];
  resume_token: string;
  status: ResponseStatus;
  created_at: string;
  submitted_at: string | null;
};

export type Answer = {
  id: string;
  response_id: string;
  question_id: string;
  body: string;
  is_unsure: boolean;
  is_skipped: boolean;
  speaker: string | null; // live mode, optional
  covered: boolean; // live mode question status
  updated_at: string;
};

export type AnswerPatch = Partial<
  Pick<Answer, "body" | "is_unsure" | "is_skipped" | "speaker" | "covered">
>;

export type NewResponse = {
  mode: ResponseMode;
  name: string;
  role: string;
  team: string;
  email?: string;
  session_name?: string;
  session_date?: string;
  attendees?: string[];
};

export interface Store {
  listQuestions(activeOnly: boolean): Promise<Question[]>;
  createQuestion(
    q: Omit<Question, "id" | "created_at">
  ): Promise<Question>;
  updateQuestion(id: string, patch: Partial<Question>): Promise<Question | null>;
  /** Hard-deletes when no answers reference it; otherwise deactivates. */
  deleteQuestion(id: string): Promise<{ deleted: boolean; deactivated: boolean }>;
  reorderQuestions(orderedIds: string[]): Promise<void>;

  createResponse(data: NewResponse): Promise<ResponseRow>;
  getResponseByToken(
    token: string
  ): Promise<{ response: ResponseRow; answers: Answer[] } | null>;
  updateResponseByToken(
    token: string,
    patch: Partial<Pick<ResponseRow, "status" | "name" | "role" | "team" | "email" | "session_name" | "session_date" | "attendees" | "submitted_at">>
  ): Promise<ResponseRow | null>;
  upsertAnswer(
    responseId: string,
    questionId: string,
    patch: AnswerPatch
  ): Promise<Answer>;

  listResponses(): Promise<ResponseRow[]>;
  listAllAnswers(): Promise<Answer[]>;
  /** Deletes a response and its answers. Returns false if it didn't exist. */
  deleteResponse(id: string): Promise<boolean>;
}
