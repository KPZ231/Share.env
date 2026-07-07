"use client";

import { Eye, EyeSlash, Check, GithubLogo, GoogleLogo, X } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "gsap";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { isEmailValid, isPasswordValid, passwordRuleResults, type PasswordRuleKey } from "@/lib/password";
import { signUpAction } from "@/app/[locale]/(marketing)/signup/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

type FieldErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword" | "terms", string>>;

export function SignupForm() {
  const t = useTranslations("signup");
  const locale = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [company, setCompany] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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
        .from("[data-signup=eyebrow]", { y: 16, opacity: 0 })
        .from("[data-signup=heading]", { y: 20, opacity: 0 }, "-=0.4")
        .from("[data-signup=subtext]", { y: 16, opacity: 0 }, "-=0.4")
        .from("[data-signup=oauth]", { y: 14, opacity: 0, stagger: 0.08 }, "-=0.35")
        .from("[data-signup=field]", { y: 14, opacity: 0, stagger: 0.06 }, "-=0.3");

      safety = setTimeout(() => tl.progress(1), 2000);
    }, rootRef);

    return () => {
      clearTimeout(safety);
      ctx.revert();
    };
  }, []);

  const rules = passwordRuleResults(password);
  const ruleLabel: Record<PasswordRuleKey, string> = {
    length: t("password.rules.length"),
    upper: t("password.rules.upper"),
    lower: t("password.rules.lower"),
    number: t("password.rules.number"),
    special: t("password.rules.special"),
  };

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) next.name = t("errors.name");
    if (!isEmailValid(trimmedEmail)) next.email = t("errors.email");
    if (!isPasswordValid(password)) next.password = t("errors.password");
    if (confirmPassword !== password) next.confirmPassword = t("errors.confirmPassword");
    if (!terms) next.terms = t("errors.terms");

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
      const result = await signUpAction({
        name,
        email,
        password,
        confirmPassword,
        terms,
        company,
        locale,
      });

      if (result.ok) {
        toast.success(t("success"));
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
      <div className="flex flex-col gap-2">
        <span
          data-signup="eyebrow"
          className="font-mono text-xs uppercase tracking-[0.12em] text-foreground/50"
        >
          {t("eyebrow")}
        </span>
        <h1 data-signup="heading" className="text-3xl font-semibold tracking-tight text-foreground">
          {t("heading")}
        </h1>
        <p data-signup="subtext" className="text-sm leading-relaxed text-foreground/60">
          {t("subtext")}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          data-signup="oauth"
          onClick={() => handleOAuth("google")}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-hairline bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-soft"
        >
          <GoogleLogo weight="bold" className="size-4" />
          Google
        </button>
        <button
          type="button"
          data-signup="oauth"
          onClick={() => handleOAuth("github")}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-hairline bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-soft"
        >
          <GithubLogo weight="bold" className="size-4" />
          GitHub
        </button>
      </div>

      <div className="flex items-center gap-3" data-signup="oauth">
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

        <div data-signup="field" className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            {t("fields.name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
            placeholder={t("placeholders.name")}
          />
        </div>

        <div data-signup="field" className="flex flex-col gap-1.5">
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
            className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
            placeholder={t("placeholders.email")}
          />
        </div>

        <div data-signup="field" className="flex flex-col gap-1.5">
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
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby="password-rules"
              className="w-full rounded-md border border-hairline bg-background px-3.5 py-2.5 pr-10 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
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

          <ul
            id="password-rules"
            aria-live="polite"
            className={`grid grid-cols-1 gap-1 overflow-hidden transition-all duration-300 sm:grid-cols-2 ${
              passwordFocused || password.length > 0 ? "mt-1 max-h-32 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {rules.map((rule) => (
              <li
                key={rule.key}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  rule.passed ? "text-emerald-600" : "text-foreground/45"
                }`}
              >
                {rule.passed ? (
                  <Check weight="bold" className="size-3.5 shrink-0" />
                ) : (
                  <X weight="bold" className="size-3.5 shrink-0" />
                )}
                {ruleLabel[rule.key]}
              </li>
            ))}
          </ul>
        </div>

        <div data-signup="field" className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            {t("fields.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            maxLength={128}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
            className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
            placeholder={t("placeholders.confirmPassword")}
          />
        </div>

        <label data-signup="field" className="flex items-start gap-2.5 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-hairline"
          />
          <span>
            {t.rich("terms", {
              link: (chunks) => (
                <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>

      <p className="text-center text-sm text-foreground/60">
        {t("hasAccount")}{" "}
        <Link href="/signin" className="font-medium text-foreground underline underline-offset-2">
          {t("logIn")}
        </Link>
      </p>
    </div>
  );
}