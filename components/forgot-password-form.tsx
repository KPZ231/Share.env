"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { isEmailValid } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const t = useTranslations("forgotPassword");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isEmailValid(email.trim())) {
      toast.error(t("errors.email"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      // Errors are intentionally swallowed  same generic "check your inbox"
      // response whether or not the account exists, to avoid user enumeration.
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/${locale}/auth/callback?redirectTo=%2F${locale}%2Freset-password`,
      });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          {t("sentHeading")}
        </h1>
        <p className="text-sm leading-relaxed text-foreground/60">{t("sentSubtext", { email })}</p>
        <Link
          href="/signin"
          className="mt-3 text-sm font-medium text-foreground underline underline-offset-2"
        >
          {t("backToSignin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          {t("heading")}
        </h1>
        <p className="text-sm leading-relaxed text-foreground/60">{t("subtext")}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t("fields.email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-hairline bg-surface-soft px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-foreground/60 focus:ring-[3px] focus:ring-white/10"
            placeholder={t("placeholders.email")}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="tactile mt-1 rounded-full border border-hairline bg-surface-soft px-6 py-3 text-[15px] font-medium text-foreground hover:border-hairline-strong hover:bg-surface-elevated disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="text-center text-sm text-foreground/60">
        <Link href="/signin" className="font-medium text-foreground underline underline-offset-2">
          {t("backToSignin")}
        </Link>
      </p>
    </div>
  );
}
