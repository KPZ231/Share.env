import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pl", "en"],
  defaultLocale: "pl",
  // as-needed: "/" serves pl directly instead of 307-redirecting to "/pl",
  // saving ~800ms of LCP on every first visit (only /en gets a prefix).
  localePrefix: "as-needed",
});
