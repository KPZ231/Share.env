import { NextResponse } from "next/server";
import { resolveCliUser } from "@/lib/cli-auth";
import { downloadCliEnvironment } from "@/lib/cli-environments";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await resolveCliUser(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!checkRateLimit(`cli-download:${userId}`, 30, 60_000)) {
    return NextResponse.json({ error: "Zbyt wiele prób. Spróbuj ponownie za chwilę." }, { status: 429 });
  }

  const unlockToken = request.headers.get("x-unlock-token");
  const result = await downloadCliEnvironment(userId, id, unlockToken);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  return new NextResponse(result.content, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
