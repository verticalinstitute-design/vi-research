import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mode = body.mode === "live" ? "live" : "async";
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "").trim();
  if (!name || !role) {
    return NextResponse.json(
      { error: "Name and role are required." },
      { status: 400 }
    );
  }
  const response = await getStore().createResponse({
    mode,
    name,
    role,
    team: String(body.team ?? "").trim(),
    email: String(body.email ?? "").trim(),
    session_name: body.session_name ? String(body.session_name) : undefined,
    session_date: body.session_date ? String(body.session_date) : undefined,
    attendees: Array.isArray(body.attendees)
      ? body.attendees.map(String)
      : undefined,
  });
  return NextResponse.json({ response });
}
