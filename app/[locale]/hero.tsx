"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { gsap } from "gsap";

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
          tl.from(
            "[data-hero=headline-line]",
            { y: 28, opacity: 0, stagger: 0.12 }
          )
            .from("[data-hero=subtext]", { y: 16, opacity: 0 }, "-=0.3")
            .from("[data-hero=cta]", { y: 16, opacity: 0, stagger: 0.08 }, "-=0.4")
            .from(
              "[data-hero=visual]",
              { clipPath: "inset(8%)", opacity: 0, scale: 0.96 },
              "-=0.7"
            )
            .from(
              "[data-hero=stats]",
              { y: 24, opacity: 0 },
              "-=0.5"
            );
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-6 lg:py-10">
      <section aria-label={t("headlineLine1")} className="relative">
        {/* Background bleeds to the viewport edge; inner content stays
            centered at max-w-7xl so headline/CTA don't stretch on wide screens. */}
        <div
          data-hero="visual"
          className="relative overflow-hidden bg-surface-soft"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-16">
            <div className="flex flex-col items-start justify-center gap-6">
              <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                <span data-hero="headline-line" className="block">
                  {t("headlineLine1")}
                </span>
                <span data-hero="headline-line" className="block">
                  {t("headlineLine2")}
                </span>
                <span data-hero="headline-line" className="block">
                  {t("headlineLine3")}
                </span>
              </h1>

              <p
                data-hero="subtext"
                className="max-w-md text-lg leading-relaxed text-foreground/70"
              >
                {t("subtext")}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  data-hero="cta"
                  className="rounded-full bg-foreground px-6 py-3 text-center text-[16px] font-medium text-background transition-opacity hover:opacity-90"
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="/docs"
                  data-hero="cta"
                  className="rounded-full bg-background px-6 py-3 text-center text-[16px] font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-90"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>

            <div className="relative min-h-[280px] overflow-hidden rounded-[16px] lg:min-h-0">
              <Image
                src="/hero-vault.png"
                alt={t("visualAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl
            data-hero="stats"
            className="relative z-10 -mt-8 grid grid-cols-2 gap-x-8 gap-y-5 rounded-2xl bg-background p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:grid-cols-4 lg:w-fit lg:p-8"
          >
            {t.raw("stats").map((stat: { value: string; label: string }) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="text-lg font-semibold text-foreground">
                  {stat.value}
                </dt>
                <dd className="text-sm text-foreground/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
