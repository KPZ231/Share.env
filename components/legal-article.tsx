export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.heading} className="flex flex-col gap-3">
          <h2 className="text-[18px] font-semibold tracking-tight text-foreground">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-relaxed text-body">
              {paragraph}
            </p>
          ))}
          {section.list && (
            <ul className="flex flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-body">
              {section.list.map((item) => (
                <li key={item} className="list-disc marker:text-mute">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function LegalArticle({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-mute">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-mute">{updated}</p>

      {intro && <p className="mt-8 text-[15px] leading-relaxed text-body">{intro}</p>}

      <div className="mt-10">
        <LegalSections sections={sections} />
      </div>
    </section>
  );
}
