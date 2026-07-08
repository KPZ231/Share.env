import { NextResponse } from "next/server";
import { pollDeviceAuth } from "@/lib/cli-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const deviceCode = body?.device_code;
  if (typeof deviceCode !== "string" || !deviceCode) {
    return NextResponse.json({ error: "device_code required" }, { status: 400 });
  }
  if (!checkRateLimit(`cli-poll:${deviceCode}`, 60, 60_000)) {
    return NextResponse.json({ error: "Zbyt wiele prób." }, { status: 429 });
  }

  const result = await pollDeviceAuth(deviceCode);
  if (result.status === "approved") return NextResponse.json({ status: "approved", token: result.token });
  if (result.status === "expired") return NextResponse.json({ status: "expired" }, { status: 410 });
  return NextResponse.json({ status: result.status });
}
