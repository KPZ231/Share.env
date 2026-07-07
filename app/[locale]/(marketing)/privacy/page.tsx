import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  robots: { index: false, follow: false },
};

const PARAGRAPHS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-foreground/50">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Privacy policy
      </h1>
      <p className="mt-3 text-sm text-foreground/50">
        Placeholder content, not yet legal-reviewed  replace before launch.
      </p>
      <div className="mt-10 flex flex-col gap-5 text-base leading-relaxed text-foreground/70">
        {PARAGRAPHS.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
