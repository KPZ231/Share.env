"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function CliInstall() {
  const t = useTranslations("cliPage.install");
  const rootRef = useRef<HTMLDivElement>(null);
  const steps = t.raw("steps") as string[];
  const code = t("code");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          gsap.from("[data-cli-install=text]", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });

          gsap.from("[data-cli-install=code]", {
            y: 24,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard permission denied, no-op  the code is still selectable by hand
    }
  }

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24">
      <section
        aria-labelledby="cli-install-heading"
        className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8"
      >
        <div data-cli-install="text" className="flex flex-col gap-5">
          <h2 id="cli-install-heading" className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>

          <ol className="mt-2 flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-base text-foreground/80">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] text-accent">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div
          data-cli-install="code"
          className="relative overflow-hidden rounded-[20px] border border-hairline bg-[#0d0d0d] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" aria-hidden />
            </div>
            <button
              type="button"
              onClick={copyCode}
              aria-label={t("copy")}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-white/85">
            <code>{code}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}
