type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  tag?: string;
};

export default function PageHero({ eyebrow, title, description, tag }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-hairline bg-surface-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {eyebrow && (
          <p
            data-page-hero-in
            className="font-mono text-xs uppercase tracking-[0.12em] text-foreground/50"
          >
            {eyebrow}
          </p>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h1
            data-page-hero-in="1"
            className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-4xl lg:text-5xl"
          >
            {title}
          </h1>

          {tag && (
            <span
              data-page-hero-in="2"
              className="w-fit rounded-full bg-accent px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-accent-foreground"
            >
              {tag}
            </span>
          )}
        </div>

        {description && (
          <p
            data-page-hero-in="2"
            className="max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg"
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
