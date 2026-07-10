import "server-only";

import sealedbox from "tweetnacl-sealedbox-js";
import { listGithubRepos } from "@/lib/github";
import type { Connector, SyncTarget } from "@/lib/integrations/connector";

// Reuses the account's existing GitHub OAuth connection (lib/github-connection.ts)
// -- there is no separate "connect GitHub Actions" credential, the workspace
// picks a repo the connecting member's GitHub token can already see.
export type GithubActionsCredential = { accessToken: string };

const GITHUB_API = "https://api.github.com";

async function listTargets(credential: GithubActionsCredential): Promise<SyncTarget[]> {
  const repos = await listGithubRepos(credential.accessToken);
  return repos.map((r) => ({ id: r.fullName, name: r.fullName }));
}

/** GitHub Actions secrets must be libsodium-sealed-box encrypted with the repo's current public key -- plaintext PUT is rejected. */
async function pushSecrets(
  credential: GithubActionsCredential,
  targetId: string,
  pairs: Record<string, string>
): Promise<void> {
  const [owner, repo] = targetId.split("/");
  if (!owner || !repo) throw new Error("Nieprawidłowe repozytorium GitHub.");
  const headers = { Authorization: `Bearer ${credential.accessToken}`, Accept: "application/vnd.github+json" };

  const keyRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/actions/secrets/public-key`, { headers });
  if (!keyRes.ok) throw new Error("Nie udało się pobrać klucza publicznego repozytorium.");
  const { key, key_id: keyId } = (await keyRes.json()) as { key: string; key_id: string };
  const publicKey = Buffer.from(key, "base64");

  for (const [name, value] of Object.entries(pairs)) {
    const sealed = sealedbox.seal(Buffer.from(value, "utf8"), publicKey);
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ encrypted_value: Buffer.from(sealed).toString("base64"), key_id: keyId }),
    });
    if (!res.ok) throw new Error(`Nie udało się ustawić sekretu ${name} w GitHub Actions.`);
  }
}

export const githubActionsConnector: Connector = {
  provider: "github-actions",
  kind: "sync",
  listTargets: (c) => listTargets(c as GithubActionsCredential),
  pushSecrets: (c, targetId, pairs) => pushSecrets(c as GithubActionsCredential, targetId, pairs),
};
