"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { gsap } from "gsap";

const ENV_LINES = [
  { key: "DATABASE_URL", value: "postgres://prod-cluster-3.internal:5432/app", masked: true },
  { key: "STRIPE_SECRET_KEY", value: "sk_live_REDACTED_EXAMPLE_VALUE", masked: true },
  { key: "JWT_SIGNING_SECRET", value: "7c1a9e4f2b8d3c6a0e5f2b7d1a4f8c3e9d6b", masked: true },
  { key: "SENTRY_DSN", value: "https://a1b2c3d4@o123456.ingest.sentry.io/42", masked: false },
];

export function Hero() {
  const t = useTranslations("hero");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return; // leave elements in their natural (visible) state

          const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.7 } });
          tl.from("[data-hero=headline-word]", { y: 24, opacity: 0, stagger: 0.03, duration: 0.5 })
            .from("[data-hero=subtext]", { y: 14, opacity: 0 }, "-=0.35")
            .from("[data-hero=cta]", { y: 14, opacity: 0, stagger: 0.08 }, "-=0.4")
            .from("[data-hero=visual]", { opacity: 0, y: 16 }, "-=0.6")
            .from(
              "[data-hero=mask]",
              { scaleX: 0, transformOrigin: "left", duration: 0.4, stagger: 0.1, ease: "power2.inOut" },
              "-=0.1"
            )
            .from("[data-hero=stats]", { y: 20, opacity: 0 }, "-=0.4");
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_120%_100%_at_20%_0%,var(--accent-glow),transparent_70%)]"
      />
      <section aria-label={t("headlineLine1")} className="relative">
        <div data-hero="visual" className="relative">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
            <div className="flex flex-col items-start justify-center gap-6">
              <h1 className="max-w-xl font-display text-5xl font-normal leading-none tracking-tight text-foreground md:text-6xl lg:text-7xl">
                {[t("headlineLine1"), t("headlineLine2"), t("headlineLine3")].map(
                  (line, lineIndex) => (
                    <span key={lineIndex} className="block overflow-hidden pb-1">
                      {line.split(" ").map((word, wordIndex) => (
                        <span
                          key={wordIndex}
                          data-hero="headline-word"
                          className="mr-[0.24em] inline-block will-change-transform"
                        >
                          {word}
                        </span>
                      ))}
                    </span>
                  )
                )}
              </h1>

              <p data-hero="subtext" className="max-w-md text-lg leading-relaxed text-body">
                {t("subtext")}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  data-hero="cta"
                  className="rounded-md bg-foreground px-6 py-2.5 text-center text-[14px] font-medium text-black transition-opacity hover:opacity-90"
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="#how-it-works"
                  data-hero="cta"
                  className="rounded-md border border-hairline-strong px-6 py-2.5 text-center text-[14px] font-medium text-foreground transition-colors hover:bg-surface-elevated"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>

            <div className="relative flex min-h-[280px] items-center lg:min-h-0">
              <div className="w-full overflow-hidden rounded-lg border border-hairline-strong bg-surface-deep">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  </div>
                  <span className="font-mono text-[11px] text-white/40">.env · production</span>
                  <span
                    aria-hidden
                    className="rounded-full bg-accent/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-accent"
                  >
                    revoke in 6h
                  </span>
                </div>

                <div className="flex flex-col gap-1 px-5 py-6 font-mono text-[13px] leading-relaxed sm:text-[14px]">
                  {ENV_LINES.map((line) => (
                    <div key={line.key} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[#7ee787]">{line.key}</span>
                      <span className="text-white/30">=</span>
                      {line.masked ? (
                        <span
                          data-hero="mask"
                          aria-label="hidden value"
                          className="inline-block h-[14px] w-40 rounded-[3px] bg-[#2a2d33]"
                        />
                      ) : (
                        <span className="text-white/60">{line.value}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 font-mono text-[11px] text-white/40">
                  <span>owner · editor · viewer</span>
                  <span>AES-256 at rest</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl
            data-hero="stats"
            className="relative z-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-hairline pt-8 sm:grid-cols-4"
          >
            {t.raw("stats").map((stat: { value: string; label: string }) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="font-mono text-2xl font-medium text-foreground">{stat.value}</dt>
                <dd className="text-sm text-mute">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
