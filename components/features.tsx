"use client";

import {
  ClockCounterClockwise,
  LinkBreak,
  LockKey,
  Terminal,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type FeatureItem = { title: string; description: string; tag: string };

const FEATURE_META: { icon: Icon; accent: string }[] = [
  { icon: LockKey, accent: "#dceeb1" }, // szyfrowanie plików
  { icon: LinkBreak, accent: "#c5b0f4" }, // linki z wygasaniem
  { icon: UsersThree, accent: "#c8e6cd" }, // kontrola dostępu per zespół
  { icon: ClockCounterClockwise, accent: "#f3c9b6" }, // historia wersji
  { icon: Terminal, accent: "#f4ecd6" }, // integracja CLI/CI-CD
];

export function Features() {
  const t = useTranslations("features");
  const rootRef = useRef<HTMLDivElement>(null);
  const items = t.raw("items") as FeatureItem[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return; // leave elements in their natural (visible) state

          gsap.from("[data-feature=header]", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 75%",
              once: true,
            },
          });

          gsap.from("[data-feature=card]", {
            y: 28,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 75%",
              once: true,
            },
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24">
      <section
        aria-labelledby="features-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div data-feature="header" className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.03em] text-foreground/60">
            {t("eyebrow")}
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">
            {t("subheading")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const meta = FEATURE_META[index];
            const FeatureIcon = meta.icon;
            const isLead = index === 0;

            return (
              <article
                key={item.title}
                data-feature="card"
                className={`group flex flex-col gap-4 rounded-[24px] border border-hairline bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-shadow will-change-transform hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] lg:p-8 ${
                  isLead ? "lg:row-span-2 lg:justify-center" : ""
                }`}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: meta.accent }}
                  aria-hidden
                >
                  <FeatureIcon size={24} weight="bold" className="text-black" />
                </span>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-base leading-relaxed text-foreground/70">
                    {item.description}
                  </p>
                </div>

                <span className="mt-auto w-fit rounded-full bg-surface-soft px-3 py-1 font-mono text-xs uppercase tracking-[0.03em] text-foreground/60">
                  {item.tag}
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
