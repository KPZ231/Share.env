"use client";

import { Fingerprint, LockKey, ShieldCheck, Timer, type Icon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type SecurityItem = { title: string; description: string };

const ICONS: Icon[] = [ShieldCheck, LockKey, Timer, Fingerprint];

export function SecurityDeepDive() {
  const t = useTranslations("securityDeepDive");
  const rootRef = useRef<HTMLDivElement>(null);
  const items = t.raw("items") as SecurityItem[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { reduce: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" },
        (context) => {
          const { reduce } = context.conditions as { reduce: boolean };
          if (reduce) return;

          const tl = gsap.timeline({
            scrollTrigger: { trigger: rootRef.current, start: "top 75%", once: true },
            defaults: { ease: "power3.out" },
          });

          tl.from("[data-security=header-text]", { y: 20, opacity: 0, duration: 0.6 })
            .from(
              "[data-security=badge]",
              { scale: 0.6, opacity: 0, duration: 0.5, ease: "back.out(1.7)" },
              "-=0.35"
            )
            .from(
              "[data-security=cell]",
              { y: 28, scale: 0.97, opacity: 0, duration: 0.55, stagger: 0.08 },
              "-=0.3"
            )
            .fromTo(
              "[data-security=code]",
              { clipPath: "inset(0 100% 0 0)" },
              { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power2.inOut" },
              "-=0.35"
            );

          gsap.fromTo(
            "[data-security=badge-glow]",
            { scale: 1, opacity: 0.5 },
            { scale: 1.4, opacity: 0, duration: 1.8, ease: "power2.out", repeat: -1 }
          );

          gsap.to("[data-security=badge-icon]", {
            scale: 1.06,
            duration: 1.8,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background py-16 lg:py-24">
      <section
        aria-labelledby="security-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div data-security="header" className="flex items-center justify-between gap-8">
          <div data-security="header-text" className="max-w-2xl">
            <h2
              id="security-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              {t("heading")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/70">{t("subheading")}</p>
          </div>

          <div data-security="badge" className="relative hidden shrink-0 sm:block" aria-hidden>
            <span
              data-security="badge-glow"
              className="absolute inset-0 rounded-full bg-accent/40"
            />
            <span
              data-security="badge-icon"
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft shadow-[0_0_32px_var(--accent-glow)] md:h-20 md:w-20"
            >
              <Image
                src="/images/lock.png"
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 md:h-11 md:w-11"
              />
            </span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <article
            data-security="cell"
            className="group flex flex-col justify-between gap-6 rounded-[24px] border border-hairline bg-surface-soft p-6 transition-colors duration-200 hover:border-hairline-strong lg:col-span-2 lg:row-span-2 lg:p-8"
          >
            <div className="flex flex-col gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-accent/15 transition-transform duration-200 ease-out group-hover:scale-105"
                aria-hidden
              >
                <ShieldCheck size={24} weight="bold" className="text-accent" />
              </span>
              <h3 className="text-xl font-semibold text-foreground">{items[0].title}</h3>
              <p className="max-w-md text-base leading-relaxed text-foreground/70">
                {items[0].description}
              </p>
            </div>

            <pre
              data-security="code"
              className="overflow-x-auto rounded-[16px] border border-hairline bg-background p-4 font-mono text-xs leading-relaxed text-foreground/80"
            >
              <code>{`create policy "workspace_members_select"
on public.env_files for select
using (is_workspace_member(workspace_id, auth.uid()));`}</code>
            </pre>
          </article>

          {items.slice(1).map((item, index) => {
            const ItemIcon = ICONS[index + 1];
            return (
              <article
                key={item.title}
                data-security="cell"
                className="group flex flex-col gap-3 rounded-[24px] border border-hairline bg-surface-soft p-6 transition-colors duration-200 hover:border-hairline-strong"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-accent/15 transition-transform duration-200 ease-out group-hover:scale-105"
                  aria-hidden
                >
                  <ItemIcon size={22} weight="bold" className="text-accent" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/70">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
