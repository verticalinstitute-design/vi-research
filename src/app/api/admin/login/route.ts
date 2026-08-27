import { NextRequest, NextResponse } from "next/server";
import {
  checkPasscode,
  clearAdminCookie,
  isAdmin,
  setAdminCookie,
} from "@/lib/admin-auth";

export async function GET() {
  return NextResponse.json({ admin: await isAdmin() });
}

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();
  if (!checkPasscode(String(passcode ?? ""))) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
