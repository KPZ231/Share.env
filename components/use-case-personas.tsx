"use client";

import { Buildings, RocketLaunch, Stack, type Icon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Persona = { title: string; description: string; payoff: string };

const ICONS: Icon[] = [RocketLaunch, Buildings, Stack];

export function UseCasePersonas() {
  const t = useTranslations("useCasePersonas");
  const rootRef = useRef<HTMLDivElement>(null);
  const items = t.raw("items") as Persona[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          gsap.from("[data-personas=header]", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });

          gsap.from("[data-personas=card]", {
            y: 24,
            opacity: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24">
      <section
        aria-labelledby="personas-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div data-personas="header" className="max-w-2xl">
          <h2
            id="personas-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {items.map((item, index) => {
            const PersonaIcon = ICONS[index];

            return (
              <article
                key={item.title}
                data-personas="card"
                className="flex flex-col gap-5 rounded-[24px] border border-hairline bg-surface-soft p-6 lg:p-8"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-accent/15"
                  aria-hidden
                >
                  <PersonaIcon size={24} weight="bold" className="text-accent" />
                </span>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-base leading-relaxed text-foreground/70">{item.description}</p>
                </div>

                <p className="mt-auto border-t border-hairline pt-4 text-sm leading-relaxed text-foreground/60">
                  {item.payoff}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
