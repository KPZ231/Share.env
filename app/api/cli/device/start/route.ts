import { NextResponse } from "next/server";
import { startDeviceAuth } from "@/lib/cli-auth";

export async function POST() {
  const result = await startDeviceAuth();
  return NextResponse.json({
    device_code: result.deviceCode,
    user_code: result.userCode,
    verification_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/cli/authorize?code=${result.userCode}`,
    expires_in: result.expiresIn,
  });
}
