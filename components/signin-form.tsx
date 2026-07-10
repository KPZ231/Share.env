"use client";

import { Eye, EyeSlash, GithubLogo, GoogleLogo } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "gsap";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { isEmailValid } from "@/lib/password";
import { signInAction } from "@/app/[locale]/(marketing)/signin/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function SigninForm() {
  const t = useTranslations("signin");
  const locale = useLocale();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [company, setCompany] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    let safety: ReturnType<typeof setTimeout> | undefined;

    const ctx = gsap.context(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const tl = gsap
        .timeline({ defaults: { ease: "power3.out", duration: 0.6 } })
        .from("[data-signin=heading]", { y: 20, opacity: 0 })
        .from("[data-signin=subtext]", { y: 16, opacity: 0 }, "-=0.4")
        .from("[data-signin=oauth]", { y: 14, opacity: 0, stagger: 0.08 }, "-=0.35")
        .from("[data-signin=field]", { y: 14, opacity: 0, stagger: 0.06 }, "-=0.3");

      safety = setTimeout(() => {
        tl.progress(1).kill();
        gsap.set(
          "[data-signin=heading], [data-signin=subtext], [data-signin=oauth], [data-signin=field]",
          { clearProps: "all" }
        );
      }, 2000);
    }, rootRef);

    return () => {
      clearTimeout(safety);
      ctx.revert();
    };
  }, []);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!isEmailValid(email.trim())) next.email = t("errors.email");
    if (password.length < 1) next.password = t("errors.password");
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (lockedUntil && Date.now() < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      toast.error(t("errors.locked", { seconds: remaining }));
      return;
    }

    if (company.trim().length > 0) {
      toast.error(t("errors.generic"));
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setAttempts(0);
        toast.error(t("errors.tooManyAttempts"));
      } else {
        toast.error(Object.values(nextErrors)[0]);
      }
      return;
    }

    setSubmitting(true);
    try {
      const result = await signInAction({ email, password, company });

      if (result.ok) {
        toast.success(t("success"));
        router.push("/");
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/${locale}/auth/callback` },
      });
    } catch {
      toast.error(t("errors.generic"));
    }
  }

  return (
    <div ref={rootRef} className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1
          data-signin="heading"
          className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl"
        >
          {t("heading")}
        </h1>
        <p data-signin="subtext" className="text-sm leading-relaxed text-foreground/60">
          {t("subtext")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          data-signin="oauth"
          onClick={() => handleOAuth("google")}
          className="tactile flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          <GoogleLogo weight="bold" className="size-4" />
          Google
        </button>
        <button
          type="button"
          data-signin="oauth"
          onClick={() => handleOAuth("github")}
          className="tactile flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          <GithubLogo weight="bold" className="size-4" />
          GitHub
        </button>
      </div>

      <div className="flex items-center gap-3" data-signin="oauth">
        <div className="h-px flex-1 bg-hairline" />
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/40">
          {t("divider")}
        </span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <input
          type="text"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        <div data-signin="field" className="flex flex-col gap-1.5">
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
            aria-invalid={Boolean(errors.email)}
            className="rounded-md border border-hairline bg-surface-soft px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-foreground/60 focus:ring-[3px] focus:ring-white/10 aria-invalid:border-red-400/60"
            placeholder={t("placeholders.email")}
          />
        </div>

        <div data-signin="field" className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {t("fields.password")}
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-foreground/60 underline underline-offset-2 hover:text-foreground">
              {t("forgot")}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              maxLength={128}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              className="w-full rounded-md border border-hairline bg-surface-soft px-3.5 py-2.5 pr-10 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-foreground/60 focus:ring-[3px] focus:ring-white/10 aria-invalid:border-red-400/60"
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
        </div>

        <label data-signin="field" className="flex items-center gap-2.5 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 shrink-0 rounded border-hairline accent-[var(--accent)]"
          />
          {t("remember")}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="tactile mt-1 rounded-full border border-hairline bg-surface-soft px-6 py-3 text-[15px] font-medium text-foreground hover:border-hairline-strong hover:bg-surface-elevated disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="text-center text-sm text-foreground/60">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-2">
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}