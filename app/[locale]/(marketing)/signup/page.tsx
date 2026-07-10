import type { Metadata } from "next";
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

export default function SignupPage() {
  return (
    <section className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[200px] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(255,255,255,0.16),transparent_75%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[640px] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(255,255,255,0.05),transparent_75%)]"
      />
      <SignupForm />
    </section>
  );
}
