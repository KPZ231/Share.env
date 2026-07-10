"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "cookie-consent-ack";

// ponytail: only strictly necessary cookies are in play (see /cookies), so this
// is a plain acknowledgement, not a consent-toggle manager. Add real opt-in
// controls if a non-essential cookie is ever introduced.
export function CookieConsentBanner() {
  const t = useTranslations("cookieConsent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reads an external system (localStorage) after mount, matching server and
    // first client render (both `false`) to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6">
      <div className="flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-body">
          {t.rich("message", {
            link: (chunks) => (
              <Link
                href="/cookies"
                className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "1");
            setVisible(false);
          }}
          className="shrink-0 self-start rounded-full bg-foreground px-5 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90 sm:self-auto"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
