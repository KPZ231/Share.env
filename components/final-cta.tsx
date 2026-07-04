"use client";

import Image from "next/image";
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

          gsap.from("[data-cta=card]", {
            y: 32,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 75%",
              once: true,
            },
          });

          gsap.to("[data-cta=mascot]", {
            y: -14,
            duration: 2.8,
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
          className="relative flex flex-col items-center gap-8 overflow-hidden rounded-[24px] bg-[#dceeb1] px-6 py-14 text-center sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-16 lg:py-16 lg:text-left"
        >
          <svg
            aria-hidden
            viewBox="0 0 800 400"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
          >
            <path
              d="M-50 260 C 120 200, 220 320, 400 260 S 680 200, 850 270 V 450 H -50 Z"
              fill="#c8e6cd"
            />
            <path
              d="M-50 320 C 150 280, 260 380, 420 330 S 700 280, 850 340 V 450 H -50 Z"
              fill="#ffffff"
              fillOpacity="0.5"
            />
          </svg>

          <div
            data-cta="text"
            className="relative z-10 flex max-w-xl flex-col gap-3"
          >
            <h2 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
              {t("heading")}
            </h2>
            <p className="text-lg leading-relaxed text-black/70">
              {t("subtext")}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-6">
            <div
              data-cta="mascot"
              className="relative h-28 w-28 shrink-0 will-change-transform sm:h-36 sm:w-36"
              aria-hidden
            >
              <Image
                src="/cta-mascot.png"
                alt=""
                fill
                sizes="144px"
                className="object-contain"
              />
            </div>

            <Link
              href="/signup"
              data-cta="button"
              className="w-fit shrink-0 rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-opacity hover:opacity-90"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
