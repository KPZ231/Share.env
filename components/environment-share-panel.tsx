"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { LinkSimple, Copy } from "@phosphor-icons/react";
import { useRouter } from "@/i18n/navigation";
import { Spinner } from "@/components/spinner";
import {
  createEnvironmentShareLinkAction,
  revokeEnvironmentShareLinkAction,
} from "@/app/[locale]/(app)/environments/[id]/share-actions";

const EXPIRY_OPTIONS = [1, 7, 30] as const;

export function EnvironmentSharePanel({
  workspaceId,
  envFileId,
  links,
}: {
  workspaceId: string;
  envFileId: string;
  links: { id: string; expiresAt: string }[];
}) {
  const t = useTranslations("environments.detail.shareLinks");
  const locale = useLocale();
  const router = useRouter();
  const [expiryDays, setExpiryDays] = useState<(typeof EXPIRY_OPTIONS)[number]>(7);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function createLink() {
    startTransition(async () => {
      const result = await createEnvironmentShareLinkAction(workspaceId, envFileId, expiryDays, locale);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCreatedUrl(result.url);
      router.refresh();
    });
  }

  function revoke(id: string) {
    startTransition(async () => {
      const result = await revokeEnvironmentShareLinkAction(workspaceId, envFileId, id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-6">
      <div className="flex items-center gap-2.5">
        <LinkSimple size={18} className="text-mute" />
        <div>
          <p className="text-[14px] font-medium text-foreground">{t("heading")}</p>
          <p className="text-[12px] text-mute">{t("hint")}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={expiryDays}
          onChange={(e) => setExpiryDays(Number(e.target.value) as (typeof EXPIRY_OPTIONS)[number])}
          className="rounded-full border border-hairline-strong bg-background px-3 py-1.5 text-[13px] text-foreground"
        >
          {EXPIRY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {t("expiryDays", { count: d })}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={createLink}
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending && <Spinner className="size-4" />}
          {t("create")}
        </button>
      </div>

      {createdUrl && (
        <div className="flex items-center gap-2 rounded-md border border-hairline bg-background px-3.5 py-2.5">
          <code className="flex-1 truncate text-[13px] text-foreground">{createdUrl}</code>
          <button
            type="button"
            onClick={() => void copyUrl(createdUrl)}
            className="shrink-0 text-mute transition-colors hover:text-foreground"
            aria-label={t("copy")}
          >
            <Copy size={16} />
          </button>
          {copied && <span className="shrink-0 text-[12px] text-accent">{t("copied")}</span>}
        </div>
      )}

      {links.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t border-hairline pt-3">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between gap-2 text-[13px] text-body">
              <span>{t("expiresAt", { date: new Date(link.expiresAt).toLocaleDateString() })}</span>
              <button
                type="button"
                onClick={() => revoke(link.id)}
                disabled={isPending}
                className="text-red-500 hover:underline disabled:opacity-50"
              >
                {t("revoke")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
