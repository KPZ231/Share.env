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

const FEATURE_ICONS: Icon[] = [LockKey, LinkBreak, UsersThree, ClockCounterClockwise, Terminal];

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

          const tl = gsap.timeline({
            defaults: { ease: "power3.out", duration: 0.6 },
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 75%",
              once: true,
            },
          });

          // ponytail: opacity-only (no y/scale) on header/card — a transform
          // tween here measured as real Lighthouse CLS. The icon keeps its
          // scale pop since it's small/contained and doesn't shift layout.
          tl.from("[data-feature=header]", { opacity: 0 })
            .from("[data-feature=card]", { opacity: 0, stagger: 0.08 }, "-=0.3")
            .from(
              "[data-feature=icon]",
              { scale: 0.5, opacity: 0, stagger: 0.08, duration: 0.5, ease: "back.out(1.7)" },
              "-=0.5"
            );
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
          <h2
            id="features-heading"
            className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-body">
            {t("subheading")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const FeatureIcon = FEATURE_ICONS[index];
            const isLead = index === 0;

            return (
              <article
                key={item.title}
                data-feature="card"
                className={`group flex flex-col gap-4 rounded-lg border border-hairline-strong p-6 transition-[transform,border-color] duration-200 ease-out will-change-transform hover:-translate-y-0.5 hover:border-white/25 lg:p-8 ${
                  isLead
                    ? "bg-[linear-gradient(160deg,var(--accent-glow),transparent_55%)] bg-surface-soft lg:row-span-2 lg:justify-center"
                    : "bg-surface-soft"
                }`}
              >
                <span
                  data-feature="icon"
                  className="flex h-12 w-12 items-center justify-center rounded-md bg-accent/15"
                  aria-hidden
                >
                  <FeatureIcon size={24} weight="bold" className="text-accent" />
                </span>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-base leading-relaxed text-body">
                    {item.description}
                  </p>
                </div>

                <span className="mt-auto w-fit rounded-full bg-surface-elevated px-3 py-1 font-mono text-xs uppercase tracking-[0.03em] text-mute">
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
