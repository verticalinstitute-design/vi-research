import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const questions = await getStore().listQuestions(false);
  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }
  const store = getStore();
  const existing = await store.listQuestions(false);
  const question = await store.createQuestion({
    code: String(body.code ?? "").trim() || `X${existing.length + 1}`,
    theme: String(body.theme ?? "").trim() || "X · Additional",
    prompt,
    helper: String(body.helper ?? "").trim(),
    source_refs: Array.isArray(body.source_refs)
      ? body.source_refs.map(String)
      : [],
    sort_order: existing.length,
    is_active: true,
  });
  return NextResponse.json({ question });
}
