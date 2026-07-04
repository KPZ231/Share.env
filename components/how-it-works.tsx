"use client";

import {
  LinkSimple,
  LockKey,
  UploadSimple,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Step = { title: string; description: string };

const STEP_ICONS: Icon[] = [UploadSimple, LockKey, LinkSimple, UsersThree];

export function HowItWorks() {
  const t = useTranslations("howItWorks");
  const rootRef = useRef<HTMLDivElement>(null);
  const steps = t.raw("steps") as Step[];

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

          tl.from("[data-hiw=header]", { y: 20, opacity: 0 })
            .from(
              "[data-hiw=step]",
              { y: 28, opacity: 0, stagger: 0.12 },
              "-=0.3"
            )
            .from(
              "[data-hiw=connector]",
              { scaleX: 0, transformOrigin: "left" },
              "-=0.5"
            );
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24 w-full ">
      <section
        id="how-it-works"
        aria-labelledby="hiw-heading"
        className="mx-auto px-4 sm:px-6 lg:px-8 bg-[#dceeb1] "
      >
        <div
          className=" mx-auto max-w-7xl px-6 py-12 text-black sm:px-10 lg:px-16 lg:py-20"
        >
          <div data-hiw="header" className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-black/60">
              {t("eyebrow")}
            </p>
            <h2
              id="hiw-heading"
              className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {t("title")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-black/70">
              {t("lead")}
            </p>
          </div>

          <ol className="relative mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const StepIcon = STEP_ICONS[index];

              return (
                <li
                  key={step.title}
                  data-hiw="step"
                  className="relative flex flex-col gap-4 rounded-[16px] bg-white/70 p-6"
                >
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden
                      data-hiw="connector"
                      className="pointer-events-none absolute right-[-1.5rem] top-1/2 z-10 hidden h-px w-6 -translate-y-1/2 bg-black/30 lg:block"
                    />
                  )}

                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white"
                      aria-hidden
                    >
                      <StepIcon size={20} weight="bold" className="text-black" />
                    </span>
                    <span className="font-mono text-xs text-black/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-black/70">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
