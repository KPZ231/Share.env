import "server-only";

import type { Connector, SyncTarget } from "@/lib/integrations/connector";

// credential.host lets self-hosted GitLab instances work too; defaults to gitlab.com.
export type GitlabCredential = { token: string; host?: string };

function apiBase(credential: GitlabCredential): string {
  return `https://${credential.host || "gitlab.com"}/api/v4`;
}

async function listTargets(credential: GitlabCredential): Promise<SyncTarget[]> {
  const res = await fetch(`${apiBase(credential)}/projects?membership=true&per_page=50&order_by=last_activity_at`, {
    headers: { "PRIVATE-TOKEN": credential.token },
  });
  if (!res.ok) throw new Error("Nie udało się pobrać projektów GitLab.");
  const json = (await res.json()) as Array<{ id: number; path_with_namespace: string }>;
  return json.map((p) => ({ id: String(p.id), name: p.path_with_namespace }));
}

/** GitLab CI/CD variables: PUT to update, POST to create if it doesn't exist yet. */
async function pushSecrets(credential: GitlabCredential, targetId: string, pairs: Record<string, string>): Promise<void> {
  const base = `${apiBase(credential)}/projects/${targetId}/variables`;
  const headers = { "PRIVATE-TOKEN": credential.token, "Content-Type": "application/json" };

  for (const [key, value] of Object.entries(pairs)) {
    const putRes = await fetch(`${base}/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ value, masked: true, protected: false }),
    });
    if (putRes.status === 404) {
      const postRes = await fetch(base, { method: "POST", headers, body: JSON.stringify({ key, value, masked: true }) });
      if (!postRes.ok) throw new Error(`Nie udało się utworzyć zmiennej ${key} w GitLab.`);
    } else if (!putRes.ok) {
      throw new Error(`Nie udało się zaktualizować zmiennej ${key} w GitLab.`);
    }
  }
}

export const gitlabConnector: Connector = {
  provider: "gitlab",
  kind: "sync",
  listTargets: (c) => listTargets(c as GitlabCredential),
  pushSecrets: (c, targetId, pairs) => pushSecrets(c as GitlabCredential, targetId, pairs),
};
