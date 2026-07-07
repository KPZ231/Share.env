import "server-only";

const GITHUB_API = "https://api.github.com";

export type GithubTokenExchange = {
  accessToken: string;
  githubUserId: number;
  githubLogin: string;
  githubAvatarUrl: string | null;
};

/** Exchanges an OAuth `code` for an access token, then fetches the identity it belongs to. */
export async function exchangeGithubCode(code: string, redirectUri: string): Promise<GithubTokenExchange> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description ?? "GitHub token exchange failed");
  }

  const userRes = await fetch(`${GITHUB_API}/user`, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}`, Accept: "application/vnd.github+json" },
  });
  if (!userRes.ok) throw new Error("Failed to fetch GitHub user");
  const userJson = await userRes.json();

  return {
    accessToken: tokenJson.access_token,
    githubUserId: userJson.id,
    githubLogin: userJson.login,
    githubAvatarUrl: userJson.avatar_url ?? null,
  };
}

export type GithubRepo = { owner: string; name: string; fullName: string; private: boolean };

export async function listGithubRepos(accessToken: string): Promise<GithubRepo[]> {
  const res = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=50`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error("Failed to fetch GitHub repositories");
  const json: unknown = await res.json();
  return (json as Array<{ owner: { login: string }; name: string; full_name: string; private: boolean }>).map(
    (r) => ({ owner: r.owner.login, name: r.name, fullName: r.full_name, private: r.private })
  );
}

export type GithubCommit = {
  sha: string;
  message: string;
  authorName: string;
  authorAvatarUrl: string | null;
  date: string;
  url: string;
};

export async function listGithubCommits(
  accessToken: string,
  owner: string,
  repo: string,
  limit = 10
): Promise<GithubCommit[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error("Failed to fetch commits");
  const json: unknown = await res.json();
  return (
    json as Array<{
      sha: string;
      html_url: string;
      commit: { message: string; author?: { name?: string; date?: string } };
      author: { login?: string; avatar_url?: string } | null;
    }>
  ).map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0],
    authorName: c.commit.author?.name ?? c.author?.login ?? "unknown",
    authorAvatarUrl: c.author?.avatar_url ?? null,
    date: c.commit.author?.date ?? "",
    url: c.html_url,
  }));
}
