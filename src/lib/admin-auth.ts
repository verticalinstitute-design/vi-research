import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "gw_admin";

function passcode(): string {
  return process.env.ADMIN_PASSCODE || "vi-research-dev";
}

export function tokenFor(code: string): string {
  return createHash("sha256").update(`gw:${code}`).digest("hex");
}

export function checkPasscode(code: string): boolean {
  return code.length > 0 && code === passcode();
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const cookie = jar.get(COOKIE)?.value;
  return cookie === tokenFor(passcode());
}

export async function setAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, tokenFor(passcode()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14, // 2 weeks
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
