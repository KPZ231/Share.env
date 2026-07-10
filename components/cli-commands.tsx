"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Command = { name: string; description: string };

export function CliCommands() {
  const t = useTranslations("cliPage.commands");
  const rootRef = useRef<HTMLDivElement>(null);
  const commands = t.raw("items") as Command[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          gsap.from("[data-cli-commands=header]", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });

          gsap.from("[data-cli-commands=row]", {
            opacity: 0,
            y: 12,
            stagger: 0.06,
            duration: 0.4,
            ease: "power2.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 70%", once: true },
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-surface-soft py-16 lg:py-24">
      <section aria-labelledby="cli-commands-heading" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div data-cli-commands="header" className="max-w-2xl">
          <h2 id="cli-commands-heading" className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[20px] border border-hairline bg-background">
          {commands.map((command, index) => (
            <div
              key={command.name}
              data-cli-commands="row"
              className={`flex flex-col gap-1 px-6 py-5 sm:flex-row sm:items-baseline sm:gap-6 lg:px-8 ${
                index > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <code className="w-fit shrink-0 rounded-md bg-accent/10 px-2.5 py-1 font-mono text-[13px] text-accent sm:w-64">
                {command.name}
              </code>
              <p className="text-base leading-relaxed text-foreground/70">{command.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
