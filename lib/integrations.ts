/**
 * Static catalog for the profile page's integrations search. "live" entries
 * are wired to a real connector (see lib/integrations/registry.ts) and link
 * to /settings/integrations; "interest" entries just record demand
 * (profiles.interested_integrations) until something gets built for them.
 * `github` itself has no standalone connector -- it's the existing
 * profile-level OAuth connection that `github-actions` reuses.
 */
export type IntegrationCatalogEntry = {
  slug: string;
  name: string;
  category: "vcs" | "ci-cd" | "hosting" | "chat";
  description: string;
  status: "live" | "interest";
};

export const INTEGRATIONS_CATALOG: IntegrationCatalogEntry[] = [
  {
    slug: "github",
    name: "GitHub",
    category: "vcs",
    description: "Sync env files to repository secrets on push.",
    status: "interest",
  },
  {
    slug: "gitlab",
    name: "GitLab",
    category: "vcs",
    description: "Sync env files to CI/CD variables per project.",
    status: "live",
  },
  {
    slug: "vercel",
    name: "Vercel",
    category: "hosting",
    description: "Push a workspace's variables straight into a project's env config.",
    status: "live",
  },
  {
    slug: "netlify",
    name: "Netlify",
    category: "hosting",
    description: "Keep site environment variables in step with your workspace.",
    status: "live",
  },
  {
    slug: "github-actions",
    name: "GitHub Actions",
    category: "ci-cd",
    description: "Inject secrets into workflow runs without copy-pasting.",
    status: "live",
  },
  {
    slug: "slack",
    name: "Slack",
    category: "chat",
    description: "Get notified when a share link is about to expire or a secret rotates.",
    status: "live",
  },
  {
    slug: "discord",
    name: "Discord",
    category: "chat",
    description: "Same alerts as Slack, for teams that live in Discord instead.",
    status: "live",
  },
];
