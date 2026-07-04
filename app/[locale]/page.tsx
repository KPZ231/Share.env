import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { Hero } from "../../components/hero";
import { HowItWorks } from "../../components/how-it-works";
import { Features } from "../../components/features";
import { Testimonials } from "../../components/testimonials";
import { Faq } from "../../components/faq";
import { FinalCta } from "../../components/final-cta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.home" });
}

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
