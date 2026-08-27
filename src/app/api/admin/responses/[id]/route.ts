import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const deleted = await getStore().deleteResponse(id);
  if (!deleted) {
    return NextResponse.json({ error: "Response not found." }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}
