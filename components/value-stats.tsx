"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Stat = { value: string; label: string };

export function ValueStats() {
  const t = useTranslations("valueStats");
  const rootRef = useRef<HTMLDivElement>(null);
  const stats = t.raw("items") as Stat[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          gsap.from("[data-value-stats=item]", {
            y: 18,
            opacity: 0,
            stagger: 0.06,
            duration: 0.5,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="border-b border-hairline bg-background py-10 lg:py-12">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} data-value-stats="item" className="flex flex-col gap-1">
              <dt className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {stat.value}
              </dt>
              <dd className="text-sm leading-relaxed text-foreground/60">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
