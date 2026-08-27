import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = getStore();
  const [responses, answers, questions] = await Promise.all([
    store.listResponses(),
    store.listAllAnswers(),
    store.listQuestions(false),
  ]);
  return NextResponse.json({ responses, answers, questions });
}
