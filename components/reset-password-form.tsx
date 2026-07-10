"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { isPasswordValid } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const t = useTranslations("resetPassword");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      toast.error(t("errors.password"));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(t("errors.generic"));
        return;
      }
      toast.success(t("success"));
      router.push("/");
    } finally {
      setSubmitting(false);
    }
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
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            {t("fields.password")}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-hairline bg-surface-soft px-3.5 py-2.5 pr-10 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-foreground/60 focus:ring-[3px] focus:ring-white/10"
              placeholder={t("placeholders.password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 transition-colors hover:text-foreground/70"
            >
              {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-foreground/50">{t("hint")}</p>
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
