"use client";

import { DiscordLogo, GithubLogo } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PRODUCT_LINKS = [
  { href: "/cli" as const, key: "cli" },
  { href: "/docs" as const, key: "docs" },
  { href: "/status" as const, key: "status" },
];

const LEGAL_LINKS = [
  { href: "/privacy" as const, key: "privacy" },
  { href: "/terms" as const, key: "terms" },
  { href: "/cookies" as const, key: "cookies" },
  { href: "/security" as const, key: "security" },
];

const SOCIAL_LINKS = [
  { href: "https://github.com/share-env", key: "github", icon: GithubLogo },
  { href: "https://discord.gg/share-env", key: "discord", icon: DiscordLogo },
];

export function Footer() {
  const t = useTranslations("footer");
  const rootRef = useRef<HTMLDivElement>(null);

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
              start: "top 85%",
              once: true,
            },
          });

          // ponytail: opacity-only (no y/scale) — a transform tween here
          // measured as real Lighthouse CLS (the footer is the tallest
          // section on the page, so any position shift scores heavily).
          tl.from("[data-footer=heading]", { opacity: 0 })
            .from("[data-footer=cta]", { opacity: 0 }, "-=0.4")
            .from("[data-footer=column]", { opacity: 0, stagger: 0.08 }, "-=0.35")
            .from("[data-footer=social]", { opacity: 0, stagger: 0.06 }, "-=0.3");
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-background">
      <footer
        aria-labelledby="footer-heading"
        className="border-t border-hairline bg-background px-4 pb-10 pt-16 text-foreground sm:px-6 lg:px-8 lg:pt-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <h2
              id="footer-heading"
              data-footer="heading"
              className="font-display text-3xl font-normal leading-tight tracking-tight md:text-4xl"
            >
              {t("heading")}
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-body">
              {t("subtext")}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 border-t border-hairline pt-10 sm:grid-cols-2 lg:grid-cols-[repeat(2,minmax(0,220px))_auto] lg:items-start lg:gap-8">
            <nav data-footer="column" aria-label={t("columns.product.title")}>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-mute">
                {t("columns.product.title")}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-body transition-colors hover:text-foreground"
                    >
                      {t(`columns.product.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav data-footer="column" aria-label={t("columns.legal.title")}>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-mute">
                {t("columns.legal.title")}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-body transition-colors hover:text-foreground"
                    >
                      {t(`columns.legal.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div
              data-footer="cta"
              className="flex sm:col-span-2 lg:col-span-1 lg:justify-self-end"
            >
              <a
                href="mailto:kpzsproductionscontact@gmail.com"
                className="w-fit rounded-md bg-foreground px-6 py-2.5 text-center text-[14px] font-medium text-black transition-opacity hover:opacity-90"
              >
                {t("contactCta")}
              </a>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-6 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold tracking-tight">share.env</p>
              <p className="text-sm text-mute">
                &copy; {new Date().getFullYear()} {t("copyright")}
              </p>
              <p className="text-sm text-mute">{t("tagline")}</p>
            </div>

            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const SocialIcon = social.icon;
                return (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`social.${social.key}`)}
                    data-footer="social"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong text-foreground transition-colors hover:bg-surface-elevated"
                  >
                    <SocialIcon size={20} weight="bold" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
