"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { gsap } from "gsap";

export function Hero() {
  const t = useTranslations("hero");
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return; // leave elements in their natural (visible) state

          const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.7 } });
          tl.from(
            "[data-hero=headline-word]",
            { y: 32, opacity: 0, rotate: 3, stagger: 0.03, duration: 0.6 }
          )
            .from("[data-hero=subtext]", { y: 16, opacity: 0 }, "-=0.35")
            .from("[data-hero=cta]", { y: 16, opacity: 0, stagger: 0.08 }, "-=0.4")
            .from(
              "[data-hero=visual]",
              { clipPath: "inset(8%)", opacity: 0, scale: 0.96 },
              "-=0.7"
            )
            .from(
              "[data-hero=chip]",
              { y: 12, opacity: 0, rotate: 0, stagger: 0.12 },
              "-=0.4"
            )
            .from(
              "[data-hero=stats]",
              { y: 24, opacity: 0 },
              "-=0.5"
            );

          gsap.to("[data-hero-chip='1']", {
            y: -10,
            duration: 2.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
          gsap.to("[data-hero-chip='2']", {
            y: 12,
            duration: 3.1,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: 0.3,
          });
        }
      );

      const el = tiltRef.current;
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const rotateX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
      const rotateY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
      const scale = gsap.quickTo(el, "scale", { duration: 0.6, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotateY(px * 16);
        rotateX(-py * 16);
        scale(1.03);
      };
      const onLeave = () => {
        rotateX(0);
        rotateY(0);
        scale(1);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-6 lg:py-10">
      <section aria-label={t("headlineLine1")} className="relative">
        {/* Background bleeds to the viewport edge; inner content stays
            centered at max-w-7xl so headline/CTA don't stretch on wide screens. */}
        <div
          data-hero="visual"
          className="relative overflow-hidden bg-surface-soft"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-16">
            <div className="flex flex-col items-start justify-center gap-6">
              <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {[t("headlineLine1"), t("headlineLine2"), t("headlineLine3")].map(
                  (line, lineIndex) => (
                    <span key={lineIndex} className="block overflow-hidden pb-1">
                      {line.split(" ").map((word, wordIndex) => (
                        <span
                          key={wordIndex}
                          data-hero="headline-word"
                          className="mr-[0.28em] inline-block will-change-transform"
                        >
                          {word}
                        </span>
                      ))}
                    </span>
                  )
                )}
              </h1>

              <p
                data-hero="subtext"
                className="max-w-md text-lg leading-relaxed text-foreground/70"
              >
                {t("subtext")}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  data-hero="cta"
                  className="rounded-full bg-foreground px-6 py-3 text-center text-[16px] font-medium text-background transition-opacity hover:opacity-90"
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="#how-it-works"
                  data-hero="cta"
                  className="rounded-full bg-background px-6 py-3 text-center text-[16px] font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-90"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>

            <div className="relative min-h-[280px] lg:min-h-0" style={{ perspective: "1200px" }}>
              <div
                ref={tiltRef}
                className="relative h-full min-h-[280px] overflow-hidden rounded-[16px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] lg:min-h-0"
                style={{ transformStyle: "preserve-3d" }}
              >
                <Image
                  src="/hero-vault.png"
                  alt={t("visualAlt")}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>

              <div
                data-hero="chip"
                data-hero-chip="1"
                className="absolute -left-4 top-6 z-10 -rotate-6 rounded-[6px] bg-[#dceeb1] px-3 py-2 font-mono text-xs uppercase tracking-[0.03em] text-black shadow-[0_4px_16px_rgba(0,0,0,0.12)] will-change-transform"
              >
                .env · encrypted
              </div>

              <div
                data-hero="chip"
                data-hero-chip="2"
                className="absolute -right-3 bottom-8 z-10 rotate-3 rounded-[6px] bg-[#c5b0f4] px-3 py-2 font-mono text-xs uppercase tracking-[0.03em] text-black shadow-[0_4px_16px_rgba(0,0,0,0.12)] will-change-transform"
              >
                owner · editor · viewer
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl
            data-hero="stats"
            className="relative z-10 -mt-8 grid grid-cols-2 gap-x-8 gap-y-5 rounded-2xl bg-background p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:grid-cols-4 lg:w-fit lg:p-8"
          >
            {t.raw("stats").map((stat: { value: string; label: string }) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="text-lg font-semibold text-foreground">
                  {stat.value}
                </dt>
                <dd className="text-sm text-foreground/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
