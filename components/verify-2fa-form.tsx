"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Key, DeviceMobile } from "@phosphor-icons/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Spinner } from "@/components/spinner";
import { signOutAction } from "@/lib/auth-actions";
import {
  verifyAccountTotpAction,
  startAccountPasskeyAuthAction,
  finishAccountPasskeyAuthAction,
} from "@/app/[locale]/(marketing)/verify-2fa/actions";

export function Verify2faForm({
  hasTotp,
  hasPasskeys,
  redirectTo,
}: {
  hasTotp: boolean;
  hasPasskeys: boolean;
  redirectTo: string;
}) {
  const t = useTranslations("verify2fa");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const codeId = useId();

  function goToDestination() {
    // A full navigation (not the i18n router) so the freshly-set cookie is
    // guaranteed to be re-read by the Proxy on the next request  redirectTo
    // is already locale-prefixed by the caller.
    window.location.assign(redirectTo);
  }

  function submitTotp() {
    if (code.length !== 6) return;
    startTransition(async () => {
      const result = await verifyAccountTotpAction(code);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      goToDestination();
    });
  }

  function submitPasskey() {
    startTransition(async () => {
      const started = await startAccountPasskeyAuthAction();
      if (!started.ok) {
        toast.error(started.error);
        return;
      }
      try {
        const response = await startAuthentication({ optionsJSON: started.options });
        const finished = await finishAccountPasskeyAuthAction(response);
        if (!finished.ok) {
          toast.error(finished.error);
          return;
        }
        goToDestination();
      } catch {
        toast.error(t("errors.passkeyFailed"));
      }
    });
  }

  if (!hasTotp && !hasPasskeys) {
    return (
      <p className="mt-6 rounded-md border border-hairline bg-surface-soft px-4 py-3 text-[13px] text-mute">
        {t("noMethods")}
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
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
              autoFocus={!hasPasskeys}
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
            {t("submit")}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => void signOutAction()}
        disabled={isPending}
        className="text-center text-[13px] text-mute hover:text-foreground disabled:opacity-50"
      >
        {t("useDifferentAccount")}
      </button>
    </div>
  );
}
