"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash } from "@phosphor-icons/react";
import { useRouter } from "@/i18n/navigation";
import { Spinner } from "@/components/spinner";
import { deleteEnvironmentAction } from "@/app/[locale]/(app)/environments/actions";

export function EnvironmentDangerZone({ envFileId, envName }: { envFileId: string; envName: string }) {
  const t = useTranslations("environments.detail.danger");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitDelete() {
    startTransition(async () => {
      const result = await deleteEnvironmentAction(envFileId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("success"));
      router.push("/environments");
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-6">
      <div className="flex items-center gap-2.5">
        <Trash size={18} className="text-red-500" />
        <div>
          <p className="text-[14px] font-medium text-foreground">{t("heading")}</p>
          <p className="text-[12px] text-mute">{t("hint")}</p>
        </div>
      </div>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="self-start rounded-full border border-red-500/50 px-4 py-2 text-[13px] font-medium text-red-500 transition-colors hover:border-red-500"
        >
          {t("trigger")}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-body">{t("confirmPrompt", { name: envName })}</p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={envName}
            className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-red-500"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submitDelete}
              disabled={isPending || confirmText !== envName}
              className="flex items-center justify-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending && <Spinner className="size-4" />}
              {t("confirmSubmit")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setConfirmText("");
              }}
              disabled={isPending}
              className="text-[13px] font-medium text-mute hover:text-foreground disabled:opacity-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
