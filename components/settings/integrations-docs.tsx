import { getTranslations } from "next-intl/server";

// ponytail: static copy, no data fetching -- just tells the owner what to do next per provider.
export async function IntegrationsDocs() {
  const t = await getTranslations("settingsIntegrations.docs");
  const steps = ["githubActions", "gitlab", "vercel", "netlify", "slack", "discord"] as const;

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-hairline-strong bg-surface-soft p-5 lg:sticky lg:top-16">
      <div>
        <h2 className="text-[15px] font-medium text-foreground">{t("title")}</h2>
        <p className="mt-1 text-[13px] text-mute">{t("intro")}</p>
      </div>
      <ul className="flex flex-col gap-4">
        {steps.map((key) => (
          <li key={key} className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-foreground">{t(`${key}.title`)}</span>
            <p className="text-[13px] text-mute">{t(`${key}.body`)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
