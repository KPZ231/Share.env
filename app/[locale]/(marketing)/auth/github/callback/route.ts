import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { verifyGithubOAuthState } from "@/lib/env-lock";
import { exchangeGithubCode } from "@/lib/github";
import { saveGithubConnection } from "@/lib/github-connection";
import { GITHUB_CALLBACK_PATH } from "@/lib/github-oauth-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { origin, searchParams } = request.nextUrl;
  const user = await requireUser();

  const cookieStore = await cookies();
  const returnTo = cookieStore.get("github_oauth_return")?.value ?? `/${locale}/environments`;
  cookieStore.delete("github_oauth_return");

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const failureUrl = new URL(returnTo, origin);
  failureUrl.searchParams.set("githubError", "connect_failed");

  if (!code || !state || !verifyGithubOAuthState(state, user.id)) {
    return NextResponse.redirect(failureUrl);
  }

  try {
    const exchange = await exchangeGithubCode(code, `${origin}${GITHUB_CALLBACK_PATH}`);
    await saveGithubConnection(user.id, exchange);
  } catch (err) {
    console.error("GitHub OAuth callback failed:", err);
    return NextResponse.redirect(failureUrl);
  }

  return NextResponse.redirect(new URL(returnTo, origin));
}
