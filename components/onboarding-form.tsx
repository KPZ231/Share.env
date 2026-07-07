"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { gsap } from "gsap";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { createWorkspaceAction } from "@/app/[locale]/onboarding/actions";
import { Spinner } from "@/components/spinner";

export function OnboardingForm({
  heading,
  subheading,
  nameLabel,
  namePlaceholder,
  submitLabel,
  submittingLabel,
  errorRequired,
  errorGeneric,
  planNote,
  next,
}: {
  heading: string;
  subheading: string;
  nameLabel: string;
  namePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  errorRequired: string;
  errorGeneric: string;
  planNote: string;
  next: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const nameId = useId();
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

    startTransition(async () => {
      const result = await createWorkspaceAction(trimmed);
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
        className="flex flex-col gap-4"
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
