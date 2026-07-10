import "server-only";

import type { Connector } from "@/lib/integrations/connector";

export type DiscordCredential = { webhookUrl: string };

async function send(credential: DiscordCredential, message: { title: string; body: string }): Promise<void> {
  const res = await fetch(credential.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `**${message.title}**\n${message.body}` }),
  });
  if (!res.ok) throw new Error("Nie udało się wysłać powiadomienia na Discord.");
}

export const discordConnector: Connector = { provider: "discord", kind: "notify", send: (c, m) => send(c as DiscordCredential, m) };
