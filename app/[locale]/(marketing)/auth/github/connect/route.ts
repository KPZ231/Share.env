import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { signGithubOAuthState } from "@/lib/env-lock";
import { sanitizeRedirectTo } from "@/lib/redirect";
import { GITHUB_CALLBACK_PATH } from "@/lib/github-oauth-config";

/**
 * Kicks off the GitHub OAuth connect flow. A plain top-level redirect (not a
 * Server Action)  OAuth authorize requests must be real navigations.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { origin } = request.nextUrl;
  const user = await requireUser();

  if (!process.env.GITHUB_CLIENT_ID) {
    const url = new URL(`/${locale}/environments`, origin);
    url.searchParams.set("githubError", "not_configured");
    return NextResponse.redirect(url);
  }

  const returnTo = sanitizeRedirectTo(request.nextUrl.searchParams.get("returnTo"), locale);
  const cookieStore = await cookies();
  cookieStore.set("github_oauth_return", returnTo, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", `${origin}${GITHUB_CALLBACK_PATH}`);
  authorizeUrl.searchParams.set("scope", "repo read:user");
  authorizeUrl.searchParams.set("state", signGithubOAuthState(user.id));

  return NextResponse.redirect(authorizeUrl);
}
