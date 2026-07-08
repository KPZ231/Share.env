import { NextResponse } from "next/server";
import { resolveCliUser } from "@/lib/cli-auth";
import { unlockCliEnvironment } from "@/lib/cli-environments";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await resolveCliUser(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!checkRateLimit(`cli-unlock:${userId}:${id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Zbyt wiele prób. Spróbuj ponownie za chwilę." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await unlockCliEnvironment(userId, id, {
    password: typeof body.password === "string" ? body.password : undefined,
    totpCode: typeof body.totp_code === "string" ? body.totp_code : undefined,
    accessKey: typeof body.access_key === "string" ? body.access_key : undefined,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  return NextResponse.json({ unlock_token: result.unlockToken });
}
