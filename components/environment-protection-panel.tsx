"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LockKey, LockKeyOpen } from "@phosphor-icons/react";
import { useRouter } from "@/i18n/navigation";
import { Spinner } from "@/components/spinner";
import {
  setEnvironmentPasswordAction,
  removeEnvironmentPasswordAction,
} from "@/app/[locale]/(app)/environments/[id]/lock-actions";

export function EnvironmentProtectionPanel({
  envFileId,
  isProtected,
  isOwner,
}: {
  envFileId: string;
  isProtected: boolean;
  isOwner: boolean;
}) {
  const t = useTranslations("environments.detail");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const pwId = useId();
  const confirmId = useId();
  const currentId = useId();

  function submitSet() {
    if (password.length < 8) {
      toast.error(t("protection.errors.tooShort"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("protection.errors.mismatch"));
      return;
    }
    startTransition(async () => {
      const result = await setEnvironmentPasswordAction(envFileId, password);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("protection.setSuccess"));
      setOpen(false);
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    });
  }

  function submitRemove() {
    startTransition(async () => {
      const result = await removeEnvironmentPasswordAction(envFileId, currentPassword);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("protection.removeSuccess"));
      setOpen(false);
      setCurrentPassword("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-hairline-strong bg-surface-soft p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {isProtected ? (
            <LockKey size={18} className="text-accent" />
          ) : (
            <LockKeyOpen size={18} className="text-mute" />
          )}
          <div>
            <p className="text-[14px] font-medium text-foreground">
              {isProtected ? t("protection.protectedTitle") : t("protection.unprotectedTitle")}
            </p>
            <p className="text-[12px] text-mute">
              {isProtected ? t("protection.protectedHint") : t("protection.unprotectedHint")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground"
        >
          {isProtected ? t("protection.manage") : t("protection.protect")}
        </button>
      </div>

      {open &&
        (isProtected ? (
          <div className="flex flex-col gap-3 border-t border-hairline pt-4">
            {!isOwner && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={currentId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
                  {t("protection.currentPasswordLabel")}
                </label>
                <input
                  id={currentId}
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
                />
              </div>
            )}
            {isOwner && <p className="text-[12px] text-mute">{t("protection.ownerOverrideHint")}</p>}
            <button
              type="button"
              onClick={submitRemove}
              disabled={isPending || (!isOwner && !currentPassword)}
              className="flex items-center justify-center gap-2 self-start rounded-full border border-hairline-strong px-5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-foreground disabled:opacity-50"
            >
              {isPending && <Spinner className="size-4" />}
              {t("protection.removeSubmit")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-t border-hairline pt-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={pwId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
                {t("protection.newPasswordLabel")}
              </label>
              <input
                id={pwId}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={confirmId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
                {t("protection.confirmPasswordLabel")}
              </label>
              <input
                id={confirmId}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
              />
            </div>
            <p className="text-[12px] text-mute">{t("protection.twoFactorNotice")}</p>
            <button
              type="button"
              onClick={submitSet}
              disabled={isPending}
              className="flex items-center justify-center gap-2 self-start rounded-full bg-foreground px-5 py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending && <Spinner className="size-4" />}
              {t("protection.setSubmit")}
            </button>
          </div>
        ))}
    </div>
  );
}
