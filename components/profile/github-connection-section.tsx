"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { GithubLogo, SpinnerGap } from "@phosphor-icons/react";
import type { GithubConnectionInfo } from "@/lib/github-connection";
import { disconnectGithubAction } from "@/app/[locale]/(app)/environments/github-actions";

export function GithubConnectionSection({ connection }: { connection: GithubConnectionInfo | null }) {
  const t = useTranslations("profile.github");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectGithubAction();
      if (!result.ok) toast.error(result.error);
      else toast.success(t("disconnected"));
    });
  }

  return (
    <div className="mt-10 flex flex-col gap-4 border-t border-hairline-strong pt-8">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">{t("title")}</h2>
        <p className="text-[13px] text-body">{t("subtitle")}</p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-hairline-strong bg-surface-soft p-5">
        <div className="flex items-center gap-2.5">
          <GithubLogo size={18} className="text-foreground" />
          <span className="text-[14px] text-foreground">
            {connection ? t("connectedAs", { login: connection.login }) : t("notConnected")}
          </span>
        </div>

        {connection ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={isPending}
            className="flex shrink-0 items-center gap-2 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-red-500/60 hover:text-red-500 disabled:opacity-60"
          >
            {isPending && <SpinnerGap size={14} className="animate-spin" />}
            {t("disconnect")}
          </button>
        ) : (
          <a
            href={`/${locale}/auth/github/connect?returnTo=${encodeURIComponent(`/${locale}/profile`)}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground"
          >
            <GithubLogo size={14} weight="fill" />
            {t("connect")}
          </a>
        )}
      </div>
    </div>
  );
}
