import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/metadata";
import { Link } from "@/i18n/navigation";

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
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {t("heading")}
      </h1>
      <p className="text-lg leading-relaxed text-foreground/70">
        {t("body")}
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-foreground px-6 py-3 text-[16px] font-medium text-background transition-opacity hover:opacity-90"
      >
        {t("backHome")}
      </Link>
    </section>
  );
}
