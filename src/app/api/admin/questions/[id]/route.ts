import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const allowed = [
    "code",
    "theme",
    "prompt",
    "helper",
    "source_refs",
    "is_active",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  const question = await getStore().updateQuestion(id, patch);
  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }
  return NextResponse.json({ question });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await getStore().deleteQuestion(id);
  return NextResponse.json(result);
}
