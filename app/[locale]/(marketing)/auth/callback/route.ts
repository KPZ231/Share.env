import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/workspace";
import { sanitizeRedirectTo } from "@/lib/redirect";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const redirectTo = sanitizeRedirectTo(searchParams.get("redirectTo"), locale);

  const supabase = await createClient();

  let exchangeError: unknown = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    exchangeError = error;
  } else {
    exchangeError = new Error("missing exchange material");
  }

  if (exchangeError) {
    const failureUrl = new URL(`/${locale}/signin`, origin);
    failureUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(failureUrl);
  }

  await ensureDefaultWorkspace(supabase);

  return NextResponse.redirect(new URL(redirectTo, origin));
}
