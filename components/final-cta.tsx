"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function FinalCta() {
  const t = useTranslations("finalCta");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return; // leave elements in their natural (visible) state

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 75%",
              once: true,
            },
          });

          tl.from("[data-cta=card]", { y: 32, opacity: 0, duration: 0.7 })
            .from("[data-cta=text]", { y: 16, opacity: 0, duration: 0.5 }, "-=0.4")
            .from(
              "[data-cta=button]",
              { y: 16, opacity: 0, scale: 0.95, duration: 0.5, ease: "back.out(1.7)" },
              "-=0.35"
            );

          gsap.to("[data-cta=glow]", {
            opacity: 0.6,
            duration: 2.4,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          data-cta="card"
          className="relative flex flex-col items-center gap-8 overflow-hidden rounded-lg border border-hairline-strong bg-surface-soft px-6 py-14 text-center sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-16 lg:py-16 lg:text-left"
        >
          <div
            data-cta="glow"
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_140%_140%_at_15%_20%,var(--accent-glow),transparent_70%)]"
          />
          <div
            data-cta="text"
            className="relative z-10 flex max-w-xl flex-col gap-3"
          >
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              {t("heading")}
            </h2>
            <p className="text-lg leading-relaxed text-body">
              {t("subtext")}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/signup"
              data-cta="button"
              className="tactile w-fit shrink-0 rounded-md bg-foreground px-8 py-3 text-base font-medium text-black hover:opacity-90"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
