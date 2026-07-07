/**
 * Static catalog for the profile page's integrations search. None of these
 * are wired to a real OAuth flow yet  "interest" just records demand
 * (profiles.interested_integrations) so it can inform what gets built next.
 */
export type IntegrationCatalogEntry = {
  slug: string;
  name: string;
  category: "vcs" | "ci-cd" | "hosting" | "chat";
  description: string;
};

export const INTEGRATIONS_CATALOG: IntegrationCatalogEntry[] = [
  {
    slug: "github",
    name: "GitHub",
    category: "vcs",
    description: "Sync env files to repository secrets on push.",
  },
  {
    slug: "gitlab",
    name: "GitLab",
    category: "vcs",
    description: "Sync env files to CI/CD variables per project.",
  },
  {
    slug: "vercel",
    name: "Vercel",
    category: "hosting",
    description: "Push a workspace's variables straight into a project's env config.",
  },
  {
    slug: "netlify",
    name: "Netlify",
    category: "hosting",
    description: "Keep site environment variables in step with your workspace.",
  },
  {
    slug: "github-actions",
    name: "GitHub Actions",
    category: "ci-cd",
    description: "Inject secrets into workflow runs without copy-pasting.",
  },
  {
    slug: "slack",
    name: "Slack",
    category: "chat",
    description: "Get notified when a share link is about to expire or a secret rotates.",
  },
  {
    slug: "discord",
    name: "Discord",
    category: "chat",
    description: "Same alerts as Slack, for teams that live in Discord instead.",
  },
];
