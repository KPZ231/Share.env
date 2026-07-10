/**
 * A user-supplied webhook URL is an SSRF vector -- restrict to each
 * provider's known incoming-webhook host so the app can't be tricked into
 * making a server-side request to an internal address.
 */
const ALLOWED_HOSTS: Record<"slack" | "discord", string[]> = {
  slack: ["hooks.slack.com"],
  discord: ["discord.com", "discordapp.com"],
};

export function assertValidWebhookUrl(provider: "slack" | "discord", raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Nieprawidłowy adres webhooka.");
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS[provider].includes(url.hostname)) {
    throw new Error(`Adres webhooka musi wskazywać na ${ALLOWED_HOSTS[provider].join(" lub ")}.`);
  }
  return url.toString();
}

// Minimal self-check for the SSRF guard  run with `npx tsx lib/integrations/webhook-url.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/integrations/webhook-url.ts")) {
  console.assert(
    assertValidWebhookUrl("slack", "https://hooks.slack.com/services/x") === "https://hooks.slack.com/services/x",
    "a genuine Slack webhook must be accepted"
  );
  for (const bad of ["http://hooks.slack.com/services/x", "https://evil.com/hooks.slack.com", "https://169.254.169.254/", "not a url"]) {
    let threw = false;
    try {
      assertValidWebhookUrl("slack", bad);
    } catch {
      threw = true;
    }
    console.assert(threw, `must reject ${bad}`);
  }
  console.log("lib/integrations/webhook-url.ts self-check passed");
}
