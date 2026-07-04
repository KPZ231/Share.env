"use client";

import { Quotes } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Testimonial = { quote: string; name: string; role: string; company: string };

export function Testimonials() {
  const t = useTranslations("testimonials");
  const rootRef = useRef<HTMLDivElement>(null);
  const items = t.raw("items") as Testimonial[];

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

          tl.from("[data-testimonial=header]", { y: 20, opacity: 0 }).from(
            "[data-testimonial=card]",
            { y: 28, opacity: 0, stagger: 0.12 },
            "-=0.3"
          );
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24">
      <section
        aria-labelledby="testimonials-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div data-testimonial="header" className="max-w-2xl">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.03em] text-foreground/60">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#c5b0f4]" />
            {t("eyebrow")}
          </p>
          <h2
            id="testimonials-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">
            {t("subheading")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <figure
              key={item.name}
              data-testimonial="card"
              className="flex flex-col gap-5 rounded-[24px] border border-hairline bg-surface-soft p-6 will-change-transform lg:p-8"
            >
              <Quotes size={28} weight="fill" className="text-[#c5b0f4]" aria-hidden />

              <blockquote className="flex-1 text-base leading-relaxed text-foreground">
                {item.quote}
              </blockquote>

              <figcaption className="flex flex-col gap-0.5 border-t border-hairline pt-4">
                <cite className="text-sm font-semibold not-italic text-foreground">
                  {item.name}
                </cite>
                <span className="text-sm text-foreground/60">
                  {item.role} · {item.company}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
