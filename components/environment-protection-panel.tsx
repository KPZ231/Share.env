"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LockKey, LockKeyOpen } from "@phosphor-icons/react";
import { useRouter } from "@/i18n/navigation";
import { Spinner } from "@/components/spinner";
import {
  setEnvironmentPasswordAction,
  setEnvironmentProtectionLevelAction,
  removeEnvironmentPasswordAction,
  type ProtectionLevel,
} from "@/app/[locale]/(app)/environments/[id]/lock-actions";

type Level = "none" | ProtectionLevel;
const LEVELS: Level[] = ["none", "password_2fa", "password_2fa_key"];

function LevelSlider({
  value,
  onChange,
  disabled,
}: {
  value: Level;
  onChange: (level: Level) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("environments.detail.protection.levels");
  const activeIndex = LEVELS.indexOf(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex rounded-full border border-hairline-strong bg-background p-1">
        <div
          className="absolute inset-y-1 rounded-full bg-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            width: `calc(${100 / LEVELS.length}% - 4px)`,
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
          }}
        />
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level)}
            className={`relative z-10 flex-1 rounded-full px-2 py-2 text-center text-[12px] font-medium transition-colors duration-150 active:scale-[0.97] disabled:cursor-not-allowed ${
              value === level ? "text-background" : "text-mute hover:text-foreground"
            }`}
          >
            {t(`${level}.label`)}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-mute">{t(`${value}.description`)}</p>
    </div>
  );
}

export function EnvironmentProtectionPanel({
  envFileId,
  isProtected,
  protectionLevel,
  isOwner,
}: {
  envFileId: string;
  isProtected: boolean;
  protectionLevel: Level;
  isOwner: boolean;
}) {
  const t = useTranslations("environments.detail");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level>(protectionLevel);
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
      const result = await setEnvironmentPasswordAction(envFileId, password, level as ProtectionLevel);
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

  function submitLevelChange(nextLevel: Level) {
    startTransition(async () => {
      const result = await setEnvironmentProtectionLevelAction(envFileId, nextLevel as ProtectionLevel);
      if (!result.ok) {
        toast.error(result.error);
        setLevel(protectionLevel);
        return;
      }
      toast.success(t("protection.levelChanged"));
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
      setLevel("none");
      setCurrentPassword("");
      router.refresh();
    });
  }

  function handleLevelChange(nextLevel: Level) {
    if (nextLevel === level) return;
    if (!isProtected) {
      if (nextLevel === "none") return;
      setLevel(nextLevel);
      return;
    }
    if (nextLevel === "none") {
      setLevel("none");
      return;
    }
    setLevel(nextLevel);
    submitLevelChange(nextLevel);
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

      {open && (
        <div className="flex flex-col gap-4 border-t border-hairline pt-4">
          <LevelSlider value={level} onChange={handleLevelChange} disabled={isPending} />
          <p className="text-[12px] text-mute">{t("protection.sessionHint")}</p>

          {level === "none" && isProtected && (
            <div className="flex flex-col gap-3">
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
          )}

          {level !== "none" && !isProtected && (
            <div className="flex flex-col gap-3">
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
          )}
        </div>
      )}
    </div>
  );
}
