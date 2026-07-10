"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Warning } from "@phosphor-icons/react";

const DISMISSED_KEY = "integrations-wip-notice-dismissed";

// ponytail: localStorage flag, no DB/profile field -- this is a one-time
// heads-up about the feature's maturity, not user data worth syncing across devices.
export function IntegrationsWipNotice() {
  const t = useTranslations("settingsIntegrations.wipNotice");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Reads an external system (localStorage) after mount, matching server and
    // first client render (both `false`) to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!window.localStorage.getItem(DISMISSED_KEY)) setOpen(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-w-md flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-elevated p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <Warning size={20} weight="fill" className="text-amber-500" />
          <h2 className="text-[15px] font-medium text-foreground">{t("title")}</h2>
        </div>
        <p className="text-[13px] text-body">{t("body")}</p>
        <p className="text-[13px] text-body">
          {t("reportPrefix")}{" "}
          <a href="mailto:kpzsproductionscontact@gmail.com" className="font-medium text-accent hover:underline">
            kpzsproductionscontact@gmail.com
          </a>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 w-fit self-end rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
