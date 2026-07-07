"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LockKey, Key, DeviceMobile } from "@phosphor-icons/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter, Link } from "@/i18n/navigation";
import { Spinner } from "@/components/spinner";
import {
  verifyEnvironmentPasswordAction,
  verifyEnvironmentTotpAction,
  startEnvironmentPasskeyAuthAction,
  finishEnvironmentPasskeyAuthAction,
  verifyEnvironmentAccessKeyAction,
} from "@/app/[locale]/(app)/environments/[id]/lock-actions";

export function EnvironmentUnlockGate({ envFileId }: { envFileId: string }) {
  const t = useTranslations("environments.detail");
  const router = useRouter();
  const [step, setStep] = useState<"password" | "twoFactor" | "accessKey">("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [hasTotp, setHasTotp] = useState(false);
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const [isPending, startTransition] = useTransition();
  const passwordId = useId();
  const codeId = useId();
  const accessKeyId = useId();

  function afterTwoFactorStep(result: { ok: true; requiresAccessKey: boolean } | { ok: false; error: string }) {
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.requiresAccessKey) setStep("accessKey");
    else router.refresh();
  }

  function submitAccessKey() {
    if (!accessKey) return;
    startTransition(async () => {
      const result = await verifyEnvironmentAccessKeyAction(envFileId, accessKey);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function submitPassword() {
    if (!password) return;
    startTransition(async () => {
      const result = await verifyEnvironmentPasswordAction(envFileId, password);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setHasTotp(result.hasTotp);
      setHasPasskeys(result.hasPasskeys);
      setStep("twoFactor");
    });
  }

  function submitTotp() {
    if (!code) return;
    startTransition(async () => {
      afterTwoFactorStep(await verifyEnvironmentTotpAction(envFileId, code));
    });
  }

  function submitPasskey() {
    startTransition(async () => {
      const started = await startEnvironmentPasskeyAuthAction(envFileId);
      if (!started.ok) {
        toast.error(started.error);
        return;
      }
      try {
        const response = await startAuthentication({ optionsJSON: started.options });
        afterTwoFactorStep(await finishEnvironmentPasskeyAuthAction(envFileId, response));
      } catch {
        toast.error(t("errors.passkeyFailed"));
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-lg border border-hairline-strong bg-surface-soft p-8 text-center lg:p-10">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
        <LockKey size={22} />
      </span>

      {step === "password" ? (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div>
            <h2 className="font-display text-xl font-normal tracking-tight text-foreground">
              {t("unlockHeading")}
            </h2>
            <p className="mt-1 text-sm text-body">{t("unlockSubheading")}</p>
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor={passwordId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
              {t("passwordLabel")}
            </label>
            <input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPassword()}
              autoFocus
              className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
            />
          </div>
          <button
            type="button"
            onClick={submitPassword}
            disabled={isPending || !password}
            className="flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <Spinner className="size-4" />}
            {t("unlockSubmit")}
          </button>
        </div>
      ) : step === "accessKey" ? (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div>
            <h2 className="font-display text-xl font-normal tracking-tight text-foreground">
              {t("accessKeyHeading")}
            </h2>
            <p className="mt-1 text-sm text-body">{t("accessKeySubheading")}</p>
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor={accessKeyId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
              {t("accessKeyLabel")}
            </label>
            <input
              id={accessKeyId}
              type="text"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAccessKey()}
              autoFocus
              className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
            />
          </div>
          <button
            type="button"
            onClick={submitAccessKey}
            disabled={isPending || !accessKey}
            className="flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <Spinner className="size-4" />}
            {t("unlockSubmit")}
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div>
            <h2 className="font-display text-xl font-normal tracking-tight text-foreground">
              {t("twoFactorHeading")}
            </h2>
            <p className="mt-1 text-sm text-body">{t("twoFactorSubheading")}</p>
          </div>

          {!hasTotp && !hasPasskeys && (
            <p className="rounded-md border border-hairline bg-background px-4 py-3 text-[13px] text-mute">
              {t("noTwoFactorEnrolled")}{" "}
              <Link href="/profile" className="font-medium text-accent hover:opacity-80">
                {t("goToProfile")}
              </Link>
            </p>
          )}

          {hasPasskeys && (
            <button
              type="button"
              onClick={submitPasskey}
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-full border border-hairline-strong px-6 py-3 text-[15px] font-medium text-foreground transition-colors hover:border-foreground disabled:opacity-50"
            >
              {isPending ? <Spinner className="size-4" /> : <Key size={16} />}
              {t("usePasskey")}
            </button>
          )}

          {hasTotp && (
            <div className="flex flex-col gap-2">
              {hasPasskeys && (
                <p className="flex items-center gap-1.5 text-[12px] text-mute">
                  <DeviceMobile size={14} />
                  {t("orUseTotp")}
                </p>
              )}
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor={codeId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
                  {t("totpLabel")}
                </label>
                <input
                  id={codeId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && submitTotp()}
                  className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-center font-mono text-[18px] tracking-[0.3em] text-foreground outline-none transition-colors focus:border-foreground"
                />
              </div>
              <button
                type="button"
                onClick={submitTotp}
                disabled={isPending || code.length !== 6}
                className="flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending && <Spinner className="size-4" />}
                {t("unlockSubmit")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
