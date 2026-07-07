"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CLI_LINES = [
  { prompt: true, text: "envshare login" },
  { prompt: false, text: "✓ authenticated as marta@acme.dev" },
  { prompt: true, text: "envshare pull --workspace api --env production" },
  { prompt: false, text: "✓ decrypted 14 variables into .env.production" },
  { prompt: true, text: "envshare link create --env production --expires 24h" },
  { prompt: false, text: "✓ https://share-env.app/l/9f2a1c...  expires in 24h" },
];

export function Integrations() {
  const t = useTranslations("integrations");
  const rootRef = useRef<HTMLDivElement>(null);
  const items = t.raw("items") as string[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          gsap.from("[data-integrations=text]", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });

          gsap.from("[data-integrations=terminal]", {
            y: 24,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
          });

          gsap.from("[data-integrations=line]", {
            opacity: 0,
            stagger: 0.12,
            duration: 0.3,
            ease: "power1.out",
            scrollTrigger: { trigger: rootRef.current, start: "top 65%", once: true },
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24">
      <section
        aria-labelledby="integrations-heading"
        className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8"
      >
        <div data-integrations="text" className="flex flex-col gap-5">
          <h2
            id="integrations-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>

          <ul className="mt-2 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base text-foreground/80">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          data-integrations="terminal"
          className="overflow-hidden rounded-[20px] border border-hairline bg-[#0d0d0d] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" aria-hidden />
          </div>
          <pre className="flex flex-col gap-2 p-5 font-mono text-[13px] leading-relaxed">
            {CLI_LINES.map((line, index) => (
              <code
                key={index}
                data-integrations="line"
                className={line.prompt ? "text-white" : "text-white/45"}
              >
                {line.prompt ? "$ " : "  "}
                {line.text}
              </code>
            ))}
          </pre>
        </div>
      </section>
    </div>
  );
}
