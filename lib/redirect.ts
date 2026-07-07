/**
 * Validates that `redirectTo` is a same-origin, locale-prefixed internal
 * path before honoring it, to prevent open-redirect attacks. Anything that
 * doesn't clearly match `/{locale}` or `/{locale}/...` is rejected in favor
 * of the locale home  never trust this value enough to pass it through
 * unchecked into a redirect.
 */
export function sanitizeRedirectTo(redirectTo: string | null | undefined, locale: string): string {
  const fallback = `/${locale}`;

  if (!redirectTo) return fallback;
  // Reject protocol-relative URLs (//evil.com) and any embedded scheme
  // (https://evil.com, javascript:, etc.) before doing anything else.
  if (redirectTo.startsWith("//")) return fallback;
  if (redirectTo.includes("://")) return fallback;
  // Must be a single leading-slash path, not e.g. "/\evil.com" tricks.
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("\\")) return fallback;

  const localePrefix = `/${locale}`;
  const isExactLocaleHome = redirectTo === localePrefix;
  const isLocalePrefixedPath = redirectTo.startsWith(`${localePrefix}/`);

  if (!isExactLocaleHome && !isLocalePrefixedPath) return fallback;

  return redirectTo;
}
