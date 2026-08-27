import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const found = await getStore().getResponseByToken(token);
  if (!found) {
    return NextResponse.json({ error: "Response not found." }, { status: 404 });
  }
  return NextResponse.json(found);
}

// PATCH handles: answer upsert ({answer: {question_id, ...patch}}),
// submission ({submit: true}), and meta updates ({meta: {...}}).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const store = getStore();
  const found = await store.getResponseByToken(token);
  if (!found) {
    return NextResponse.json({ error: "Response not found." }, { status: 404 });
  }
  const body = await req.json();

  if (body.answer?.question_id) {
    const { question_id, ...patch } = body.answer;
    const answer = await store.upsertAnswer(
      found.response.id,
      String(question_id),
      {
        ...(patch.body !== undefined ? { body: String(patch.body) } : {}),
        ...(patch.is_unsure !== undefined
          ? { is_unsure: Boolean(patch.is_unsure) }
          : {}),
        ...(patch.is_skipped !== undefined
          ? { is_skipped: Boolean(patch.is_skipped) }
          : {}),
        ...(patch.speaker !== undefined
          ? { speaker: patch.speaker ? String(patch.speaker) : null }
          : {}),
        ...(patch.covered !== undefined
          ? { covered: Boolean(patch.covered) }
          : {}),
      }
    );
    return NextResponse.json({ answer });
  }

  if (body.submit) {
    const response = await store.updateResponseByToken(token, {
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });
    return NextResponse.json({ response });
  }

  if (body.meta) {
    const allowed = [
      "name",
      "role",
      "team",
      "email",
      "session_name",
      "session_date",
      "attendees",
    ] as const;
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body.meta[key] !== undefined) patch[key] = body.meta[key];
    }
    const response = await store.updateResponseByToken(token, patch);
    return NextResponse.json({ response });
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}
