import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const questions = await getStore().listQuestions(true);
  return NextResponse.json({ questions });
}
