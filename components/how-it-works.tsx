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
              "[data-hiw=icon]",
              { scale: 0.5, opacity: 0, stagger: 0.12, duration: 0.5, ease: "back.out(1.7)" },
              "-=0.6"
            )
            .from(
              "[data-hiw=rule]",
              { scaleX: 0, transformOrigin: "left", stagger: 0.1, duration: 0.5 },
              "-=0.7"
            );
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative w-full overflow-hidden bg-background py-16 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_120%_100%_at_80%_0%,var(--accent-glow),transparent_70%)] [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)]"
      />
      <section
        id="how-it-works"
        aria-labelledby="hiw-heading"
        className="relative mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div
          className="mx-auto max-w-7xl py-12 text-foreground lg:py-20"
        >
          <div data-hiw="header" className="max-w-2xl">
            <h2
              id="hiw-heading"
              className="font-display text-3xl font-normal tracking-tight md:text-4xl"
            >
              {t("title")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-body">
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
                  className="relative flex flex-col gap-5 pt-6"
                >
                  <span
                    aria-hidden
                    data-hiw="rule"
                    className="absolute inset-x-0 top-0 h-px bg-hairline-strong"
                  />

                  <div className="flex items-center justify-between">
                    <span
                      data-hiw="icon"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15"
                      aria-hidden
                    >
                      <StepIcon size={20} weight="bold" className="text-accent" />
                    </span>
                    <span className="font-mono text-sm text-mute">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-body">
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
