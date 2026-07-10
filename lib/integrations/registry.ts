import "server-only";

import type { Connector, IntegrationProvider } from "@/lib/integrations/connector";
import { githubActionsConnector } from "@/lib/integrations/github-actions";
import { gitlabConnector } from "@/lib/integrations/gitlab";
import { vercelConnector } from "@/lib/integrations/vercel";
import { netlifyConnector } from "@/lib/integrations/netlify";
import { slackConnector } from "@/lib/integrations/slack";
import { discordConnector } from "@/lib/integrations/discord";

const CONNECTORS: Record<IntegrationProvider, Connector> = {
  "github-actions": githubActionsConnector,
  gitlab: gitlabConnector,
  vercel: vercelConnector,
  netlify: netlifyConnector,
  slack: slackConnector,
  discord: discordConnector,
};

export function getConnector(provider: IntegrationProvider): Connector {
  return CONNECTORS[provider];
}
