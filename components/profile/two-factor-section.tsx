"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Key, DeviceMobile, Trash, SpinnerGap } from "@phosphor-icons/react";
import { startRegistration } from "@simplewebauthn/browser";
import type { TwoFactorStatus } from "@/lib/two-factor";
import {
  startTotpEnrollmentAction,
  confirmTotpEnrollmentAction,
  deleteTotpCredentialAction,
  startPasskeyRegistrationAction,
  finishPasskeyRegistrationAction,
  deleteWebauthnCredentialAction,
} from "@/app/[locale]/(app)/profile/two-factor-actions";

export function TwoFactorSection({ status }: { status: TwoFactorStatus }) {
  const t = useTranslations("profile.twoFactor");
  const [hasTotp, setHasTotp] = useState(status.hasTotp);
  const [passkeys, setPasskeys] = useState(status.passkeys);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; uri: string; qr: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const codeId = useId();
  const labelId = useId();

  function beginTotpSetup() {
    startTransition(async () => {
      const result = await startTotpEnrollmentAction();
      if (!result.ok) {
        toast.error(t("errors.generic"));
        return;
      }
      setTotpSetup({ secret: result.secret, uri: result.uri, qr: result.qr });
    });
  }

  function confirmTotp() {
    if (!totpSetup || totpCode.length !== 6) return;
    startTransition(async () => {
      const result = await confirmTotpEnrollmentAction(totpSetup.secret, totpCode);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setHasTotp(true);
      setTotpSetup(null);
      setTotpCode("");
      toast.success(t("totp.enrolled"));
    });
  }

  function removeTotp() {
    startTransition(async () => {
      const result = await deleteTotpCredentialAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setHasTotp(false);
      toast.success(t("totp.removed"));
    });
  }

  function addPasskey() {
    startTransition(async () => {
      const started = await startPasskeyRegistrationAction();
      if (!started.ok) {
        toast.error(started.error);
        return;
      }
      try {
        const response = await startRegistration({ optionsJSON: started.options });
        const label = deviceLabel.trim() || t("passkeys.defaultLabel");
        const finished = await finishPasskeyRegistrationAction(response, label);
        if (!finished.ok) {
          toast.error(finished.error);
          return;
        }
        setPasskeys((prev) => [
          { id: response.id, deviceLabel: label, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setDeviceLabel("");
        toast.success(t("passkeys.enrolled"));
      } catch {
        toast.error(t("errors.passkeyFailed"));
      }
    });
  }

  function removePasskey(id: string) {
    startTransition(async () => {
      const result = await deleteWebauthnCredentialAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      toast.success(t("passkeys.removed"));
    });
  }

  return (
    <div className="mt-10 flex flex-col gap-5 border-t border-hairline pt-8">
      <div>
        <h2 className="text-[15px] font-medium text-foreground">{t("title")}</h2>
        <p className="text-[13px] text-mute">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Key size={18} className="text-accent" />
            <div>
              <p className="text-[14px] font-medium text-foreground">{t("passkeys.title")}</p>
              <p className="text-[12px] text-mute">{t("passkeys.hint")}</p>
            </div>
          </div>
        </div>

        {passkeys.length > 0 && (
          <ul className="flex flex-col divide-y divide-hairline">
            {passkeys.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-[13px] text-foreground">{p.deviceLabel ?? t("passkeys.defaultLabel")}</span>
                <button
                  type="button"
                  onClick={() => removePasskey(p.id)}
                  disabled={isPending}
                  className="shrink-0 rounded-md p-1.5 text-mute hover:text-foreground disabled:opacity-50"
                  aria-label={t("passkeys.remove")}
                >
                  <Trash size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor={labelId} className="sr-only">
            {t("passkeys.labelPlaceholder")}
          </label>
          <input
            id={labelId}
            type="text"
            value={deviceLabel}
            onChange={(e) => setDeviceLabel(e.target.value)}
            placeholder={t("passkeys.labelPlaceholder")}
            maxLength={60}
            className="flex-1 rounded-md border border-hairline bg-background px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-foreground"
          />
          <button
            type="button"
            onClick={addPasskey}
            disabled={isPending}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-hairline-strong px-3.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground disabled:opacity-50"
          >
            {isPending ? <SpinnerGap size={14} className="animate-spin" /> : <Key size={14} />}
            {t("passkeys.add")}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <DeviceMobile size={18} className="text-accent" />
            <div>
              <p className="text-[14px] font-medium text-foreground">{t("totp.title")}</p>
              <p className="text-[12px] text-mute">{t("totp.hint")}</p>
            </div>
          </div>
          {hasTotp ? (
            <button
              type="button"
              onClick={removeTotp}
              disabled={isPending}
              className="shrink-0 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-red-500/60 hover:text-red-500 disabled:opacity-50"
            >
              {t("totp.remove")}
            </button>
          ) : (
            !totpSetup && (
              <button
                type="button"
                onClick={beginTotpSetup}
                disabled={isPending}
                className="shrink-0 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground disabled:opacity-50"
              >
                {t("totp.add")}
              </button>
            )
          )}
        </div>

        {totpSetup && (
          <div className="flex flex-col gap-3 border-t border-hairline pt-4">
            <p className="text-[13px] text-body">{t("totp.scanHint")}</p>
            {/* Dynamically generated data: URL  not eligible for next/image optimization, same tradeoff as the avatar preview. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={totpSetup.qr}
              alt={t("totp.qrAlt")}
              width={220}
              height={220}
              className="size-[220px] self-start rounded-md border border-hairline bg-white p-2"
            />
            <p className="text-[13px] text-body">{t("totp.manualEntryHint")}</p>
            <code className="break-all rounded-md border border-hairline bg-background px-3 py-2 text-[13px] text-foreground">
              {totpSetup.secret}
            </code>
            <div className="flex items-center gap-2">
              <label htmlFor={codeId} className="sr-only">
                {t("totp.codeLabel")}
              </label>
              <input
                id={codeId}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder={t("totp.codeLabel")}
                className="w-32 rounded-md border border-hairline bg-background px-3 py-2 text-center font-mono text-[15px] tracking-[0.2em] text-foreground outline-none transition-colors focus:border-foreground"
              />
              <button
                type="button"
                onClick={confirmTotp}
                disabled={isPending || totpCode.length !== 6}
                className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending && <SpinnerGap size={14} className="animate-spin" />}
                {t("totp.confirm")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
