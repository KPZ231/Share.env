import "server-only";

import { prisma } from "@/lib/prisma";
import { getIntegrationCredentialAdmin } from "@/lib/integration-connection";
import { getConnector } from "@/lib/integrations/registry";
import { NOTIFY_PROVIDERS, type NotificationPayload } from "@/lib/integrations/connector";

/**
 * Fans a notification out to every chat integration connected for a
 * workspace. Best-effort: one provider failing (bad/revoked webhook) must
 * not block the others or the caller's main action, so failures are
 * swallowed here -- this is alerting, not a critical path.
 */
export async function notifyWorkspace(workspaceId: string, message: NotificationPayload): Promise<void> {
  const connections = await prisma.integrationConnection.findMany({
    where: { workspaceId, provider: { in: [...NOTIFY_PROVIDERS] } },
    select: { provider: true },
  });

  await Promise.all(
    connections.map(async ({ provider }) => {
      try {
        const credential = await getIntegrationCredentialAdmin(workspaceId, provider as (typeof NOTIFY_PROVIDERS)[number]);
        if (!credential) return;
        const connector = getConnector(provider as (typeof NOTIFY_PROVIDERS)[number]);
        if (connector.kind === "notify") await connector.send(credential, message);
      } catch {
        // ponytail: best-effort fan-out, per-provider failures are swallowed; add a
        // dead-webhook badge in the integrations UI if silent failures become a complaint.
      }
    })
  );
}
