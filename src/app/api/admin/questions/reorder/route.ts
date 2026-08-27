import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "ids must be an array." }, { status: 400 });
  }
  await getStore().reorderQuestions(ids.map(String));
  return NextResponse.json({ ok: true });
}
