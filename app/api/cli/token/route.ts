import { NextResponse } from "next/server";
import { revokeCliToken } from "@/lib/cli-auth";

export async function DELETE(request: Request) {
  await revokeCliToken(request);
  return NextResponse.json({ ok: true });
}
