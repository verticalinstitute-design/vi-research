# VI Research Platform — B2B research capture

Internal platform for collecting BD/Sales answers to the **B2B Website
Research & Opportunity Analysis** (Aug 2026), Sections 6 (S1–S12) and
8 (Q1–Q20), merged into 20+ questions across themes A–E (admin-editable).

## Surfaces

| Route    | Who              | What                                                        |
| -------- | ---------------- | ------------------------------------------------------------ |
| `/`      | Respondents      | Welcome page → survey                                        |
| `/survey`| BD/Sales (async) | One question per screen, autosave, skip, resume link         |
| `/live`  | Facilitator      | Non-linear console for the group session, speaker tags       |
| `/admin` | UX team          | Passcode-gated: question CRUD, responses, synthesis, exports, facilitator console link |

## Local development

```bash
npm install
npm run dev
```

No environment setup needed locally — with no Supabase env vars the app uses a
file store at `.data/db.json` (delete it to reset) and seeds the question set
automatically. The local admin passcode is `vi-research-dev`.

## Production (Vercel + Supabase)

1. Create a Supabase project → SQL editor → run `supabase/schema.sql`.
2. On Vercel, set env vars:
   - `SUPABASE_URL` — the project URL
   - `SUPABASE_SERVICE_KEY` — the service role key (server-only; never exposed)
   - `ADMIN_PASSCODE` — the UX team passcode
3. Deploy. The question set seeds itself on the first request.

All database access is server-side with the service key; RLS is enabled with
no public policies, so the anon key can access nothing.

## Data model

`questions` (admin-editable; deleting a question with answers deactivates it
instead) · `responses` (async respondents and live sessions; resumable via
unguessable `resume_token`) · `answers` (one per response × question, with
`is_skipped`, and live-mode `speaker`/`covered`).

## Exports

From `/admin`: CSV (flat), XLSX (Responses / Answers / By-question sheets),
and Markdown grouped by question for the synthesis doc.
