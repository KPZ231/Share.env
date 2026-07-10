import "server-only";

/**
 * One shared shape for every third-party integration. "sync" connectors push
 * env values into an external secret store (a repo, a CI project, a hosting
 * project); "notify" connectors send a chat alert. A connector never touches
 * the DB itself -- lib/integration-connection.ts owns storage/encryption, the
 * server actions own auth -- it only knows how to talk to the provider's API.
 */

export type SyncTarget = { id: string; name: string };

export type Connector =
  | {
      provider: string;
      kind: "sync";
      /** Lists pushable targets (repos/projects/sites) for the connected credential. */
      listTargets(credential: unknown): Promise<SyncTarget[]>;
      /** Pushes every pair to the given target. Must throw with a user-safe message on failure. */
      pushSecrets(credential: unknown, targetId: string, pairs: Record<string, string>): Promise<void>;
    }
  | {
      provider: string;
      kind: "notify";
      send(credential: unknown, message: NotificationPayload): Promise<void>;
    };

export type NotificationPayload = {
  title: string;
  body: string;
};

export const SYNC_PROVIDERS = ["github-actions", "gitlab", "vercel", "netlify"] as const;
export const NOTIFY_PROVIDERS = ["slack", "discord"] as const;
export type SyncProvider = (typeof SYNC_PROVIDERS)[number];
export type NotifyProvider = (typeof NOTIFY_PROVIDERS)[number];
export type IntegrationProvider = SyncProvider | NotifyProvider;

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return (SYNC_PROVIDERS as readonly string[]).includes(value) || (NOTIFY_PROVIDERS as readonly string[]).includes(value);
}
