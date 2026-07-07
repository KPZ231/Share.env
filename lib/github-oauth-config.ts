/**
 * GitHub OAuth Apps register exactly one callback URL. Rather than asking
 * for one per locale, the callback route always lives under this fixed
 * path regardless of which locale the user started from  it has no UI, it
 * only processes the exchange and redirects onward via the `returnTo` cookie.
 */
export const GITHUB_CALLBACK_PATH = "/pl/auth/github/callback";
