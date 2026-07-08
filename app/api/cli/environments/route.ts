import { NextResponse } from "next/server";
import { resolveCliUser } from "@/lib/cli-auth";
import { listCliEnvironments } from "@/lib/cli-environments";

export async function GET(request: Request) {
  const userId = await resolveCliUser(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const environments = await listCliEnvironments(userId);
  return NextResponse.json({ environments });
}
