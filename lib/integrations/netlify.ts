import "server-only";

import type { Connector, SyncTarget } from "@/lib/integrations/connector";

export type NetlifyCredential = { token: string };

const NETLIFY_API = "https://api.netlify.com/api/v1";

async function listTargets(credential: NetlifyCredential): Promise<SyncTarget[]> {
  const res = await fetch(`${NETLIFY_API}/sites`, { headers: { Authorization: `Bearer ${credential.token}` } });
  if (!res.ok) throw new Error("Nie udało się pobrać site'ów Netlify.");
  const json = (await res.json()) as Array<{ site_id: string; name: string }>;
  return json.map((s) => ({ id: s.site_id, name: s.name }));
}

/** Netlify's env API takes the whole set per key in one PATCH per variable (scoped to all contexts). */
async function pushSecrets(credential: NetlifyCredential, targetId: string, pairs: Record<string, string>): Promise<void> {
  const headers = { Authorization: `Bearer ${credential.token}`, "Content-Type": "application/json" };

  for (const [key, value] of Object.entries(pairs)) {
    const res = await fetch(`${NETLIFY_API}/sites/${targetId}/env/${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ key, values: [{ value, context: "all" }] }),
    });
    if (res.status === 404) {
      const createRes = await fetch(`${NETLIFY_API}/sites/${targetId}/env`, {
        method: "POST",
        headers,
        body: JSON.stringify([{ key, values: [{ value, context: "all" }] }]),
      });
      if (!createRes.ok) throw new Error(`Nie udało się utworzyć zmiennej ${key} w Netlify.`);
    } else if (!res.ok) {
      throw new Error(`Nie udało się zaktualizować zmiennej ${key} w Netlify.`);
    }
  }
}

export const netlifyConnector: Connector = {
  provider: "netlify",
  kind: "sync",
  listTargets: (c) => listTargets(c as NetlifyCredential),
  pushSecrets: (c, targetId, pairs) => pushSecrets(c as NetlifyCredential, targetId, pairs),
};
