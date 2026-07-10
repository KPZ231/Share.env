import "server-only";

import type { Connector } from "@/lib/integrations/connector";

export type SlackCredential = { webhookUrl: string };

async function send(credential: SlackCredential, message: { title: string; body: string }): Promise<void> {
  const res = await fetch(credential.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `*${message.title}*\n${message.body}` }),
  });
  if (!res.ok) throw new Error("Nie udało się wysłać powiadomienia na Slack.");
}

export const slackConnector: Connector = { provider: "slack", kind: "notify", send: (c, m) => send(c as SlackCredential, m) };
