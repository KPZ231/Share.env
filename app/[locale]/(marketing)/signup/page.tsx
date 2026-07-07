import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { SignupForm } from "@/components/signup-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.signup", path: "/signup", noindex: true });
}

export default async function SignupPage() {
  const t = await getTranslations("signup");

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-16 sm:px-6 lg:px-12">
        <SignupForm />
      </div>

      <div className="relative hidden overflow-hidden rounded-[24px] bg-[#1f1d3d] lg:m-4 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Image
          src="/hero-vault.png"
          alt=""
          fill
          aria-hidden="true"
          sizes="40vw"
          className="object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="relative z-10 font-mono text-xs uppercase tracking-[0.14em] text-white/50">
          share.env
        </div>
        <div className="relative z-10 flex flex-col gap-3">
          <h2 className="max-w-sm text-4xl font-semibold leading-[1.1] tracking-tight text-white">
            {t("panel.heading")}
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-white/60">{t("panel.body")}</p>
        </div>
      </div>
    </section>
  );
}
