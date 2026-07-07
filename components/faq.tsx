"use client";

import { EnvelopeSimple } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type FaqItem = { question: string; answer: string };

export function Faq() {
  const t = useTranslations("faq");
  const rootRef = useRef<HTMLDivElement>(null);
  const items = t.raw("items") as FaqItem[];

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

          tl.from("[data-faq=header]", { y: 20, opacity: 0 })
            .from("[data-faq=contact]", { y: 20, opacity: 0 }, "-=0.4")
            .from(
              "[data-faq=icon]",
              { scale: 0.5, opacity: 0, duration: 0.4, ease: "back.out(1.7)" },
              "-=0.3"
            )
            .from(
              "[data-faq=item]",
              { y: 24, opacity: 0, stagger: 0.08 },
              "-=0.4"
            );
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24">
      <section
        aria-labelledby="faq-heading"
        className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-16 lg:px-8"
      >
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div data-faq="header" className="flex flex-col gap-4">
            <h2
              id="faq-heading"
              className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl"
            >
              {t("heading")}
            </h2>
          </div>

          <div
            data-faq="contact"
            className="mt-8 flex flex-col gap-4 rounded-lg border border-hairline-strong bg-surface-soft p-6"
          >
            <span
              data-faq="icon"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15"
              aria-hidden
            >
              <EnvelopeSimple size={20} weight="bold" className="text-accent" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-foreground">
                {t("contactTitle")}
              </h3>
              <p className="text-sm leading-relaxed text-body">
                {t("contactText")}
              </p>
            </div>
            <a
              href="mailto:support@share-env.app"
              className="mt-1 w-fit rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              {t("contactCta")}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <details
              key={item.question}
              data-faq="item"
              open={index === 0}
              className="group rounded-lg border border-hairline-strong bg-surface-soft px-6 py-4 open:pb-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-medium text-foreground marker:content-none">
                {item.question}
                <span
                  aria-hidden
                  className="shrink-0 text-2xl leading-none text-mute transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-body">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
