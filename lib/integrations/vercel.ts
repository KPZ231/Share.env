import "server-only";

import type { Connector, SyncTarget } from "@/lib/integrations/connector";

export type VercelCredential = { token: string; teamId?: string };

const VERCEL_API = "https://api.vercel.com";

function teamQuery(credential: VercelCredential): string {
  return credential.teamId ? `?teamId=${encodeURIComponent(credential.teamId)}` : "";
}

async function listTargets(credential: VercelCredential): Promise<SyncTarget[]> {
  const res = await fetch(`${VERCEL_API}/v9/projects${teamQuery(credential)}`, {
    headers: { Authorization: `Bearer ${credential.token}` },
  });
  if (!res.ok) throw new Error("Nie udało się pobrać projektów Vercel.");
  const json = (await res.json()) as { projects: Array<{ id: string; name: string }> };
  return json.projects.map((p) => ({ id: p.id, name: p.name }));
}

/** Vercel upserts by (key, target) -- creating a duplicate key just adds another value, so existing ones for our targets are removed first. */
async function pushSecrets(credential: VercelCredential, targetId: string, pairs: Record<string, string>): Promise<void> {
  const suffix = teamQuery(credential);
  const headers = { Authorization: `Bearer ${credential.token}`, "Content-Type": "application/json" };

  const existingRes = await fetch(`${VERCEL_API}/v10/projects/${targetId}/env${suffix}`, { headers });
  const existing = existingRes.ok
    ? ((await existingRes.json()) as { envs: Array<{ id: string; key: string }> }).envs
    : [];

  for (const [key, value] of Object.entries(pairs)) {
    const stale = existing.find((e) => e.key === key);
    if (stale) {
      await fetch(`${VERCEL_API}/v9/projects/${targetId}/env/${stale.id}${suffix}`, { method: "DELETE", headers });
    }
    const res = await fetch(`${VERCEL_API}/v10/projects/${targetId}/env${suffix}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview", "development"] }),
    });
    if (!res.ok) throw new Error(`Nie udało się ustawić zmiennej ${key} w Vercel.`);
  }
}

export const vercelConnector: Connector = {
  provider: "vercel",
  kind: "sync",
  listTargets: (c) => listTargets(c as VercelCredential),
  pushSecrets: (c, targetId, pairs) => pushSecrets(c as VercelCredential, targetId, pairs),
};
