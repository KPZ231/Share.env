"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { gsap } from "gsap";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { createWorkspaceAction } from "@/app/[locale]/onboarding/actions";
import { Spinner } from "@/components/spinner";
import type { AccountType } from "@/lib/onboarding-survey";

type Option = { value: string; label: string };

export function OnboardingForm({
  heading,
  subheading,
  nameLabel,
  namePlaceholder,
  submitLabel,
  submittingLabel,
  errorRequired,
  errorSurveyRequired,
  errorGeneric,
  planNote,
  next,
  referralSourceLabel,
  referralSourceOptions,
  accountTypeLabel,
  accountTypeOptions,
  companySizeLabel,
  companySizeOptions,
  selectPlaceholder,
}: {
  heading: string;
  subheading: string;
  nameLabel: string;
  namePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  errorRequired: string;
  errorSurveyRequired: string;
  errorGeneric: string;
  planNote: string;
  next: string | null;
  referralSourceLabel: string;
  referralSourceOptions: Option[];
  accountTypeLabel: string;
  accountTypeOptions: Option[];
  companySizeLabel: string;
  companySizeOptions: Option[];
  selectPlaceholder: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [companySize, setCompanySize] = useState("");
  const [isPending, startTransition] = useTransition();
  const nameId = useId();
  const referralId = useId();
  const companySizeId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 12,
        duration: 0.4,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error(errorRequired);
      return;
    }
    if (!referralSource || !accountType || (accountType === "company" && !companySize)) {
      toast.error(errorSurveyRequired);
      return;
    }

    startTransition(async () => {
      const result = await createWorkspaceAction(trimmed, {
        referralSource,
        accountType,
        companySize: accountType === "company" ? companySize : null,
      });
      if (!result.ok) {
        toast.error(result.error || errorGeneric);
        return;
      }
      // Same-origin internal path only  reject protocol-relative ("//evil.com")
      // and backslash tricks, mirroring lib/redirect.ts's sanitizeRedirectTo.
      const isSafeNext =
        !!next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") && !next.includes("://");
      router.push(isSafeNext ? next : "/dashboard");
      router.refresh();
    });
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-6 rounded-lg border border-hairline-strong bg-surface-soft p-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">{heading}</h1>
        <p className="text-sm text-body">{subheading}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
            {nameLabel}
          </label>
          <input
            id={nameId}
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={namePlaceholder}
            maxLength={60}
            disabled={isPending}
            className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-hairline pt-5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-mute">{accountTypeLabel}</span>
            <div className="flex gap-2" role="radiogroup" aria-label={accountTypeLabel}>
              {accountTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={accountType === option.value}
                  disabled={isPending}
                  onClick={() => setAccountType(option.value as AccountType)}
                  className={`flex-1 rounded-md border px-3.5 py-2.5 text-[15px] font-medium transition-colors disabled:opacity-50 ${
                    accountType === option.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-hairline bg-background text-foreground hover:border-foreground/40"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`flex flex-col gap-1.5 overflow-hidden transition-all duration-300 ${
              accountType === "company" ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <label htmlFor={companySizeId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
              {companySizeLabel}
            </label>
            <select
              id={companySizeId}
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              disabled={isPending || accountType !== "company"}
              className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-50"
            >
              <option value="">{selectPlaceholder}</option>
              {companySizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={referralId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
              {referralSourceLabel}
            </label>
            <select
              id={referralId}
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              disabled={isPending}
              className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-50"
            >
              <option value="">{selectPlaceholder}</option>
              {referralSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending && <Spinner className="size-4 border-background border-t-transparent" />}
          {isPending ? submittingLabel : submitLabel}
        </button>
      </form>

      <p className="text-xs text-mute">{planNote}</p>
    </div>
  );
}
