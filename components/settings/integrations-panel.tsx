"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle, Trash, ArrowSquareOut } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { INTEGRATIONS_CATALOG } from "@/lib/integrations";
import type { SyncTarget } from "@/lib/integrations/connector";
import {
  connectGithubActionsAction,
  connectTokenIntegrationAction,
  connectWebhookIntegrationAction,
  disconnectIntegrationAction,
  listSyncTargetsAction,
  linkSyncTargetAction,
  syncEnvironmentAction,
} from "@/app/[locale]/(app)/settings/integrations/actions";

const SYNC_PROVIDERS = ["github-actions", "gitlab", "vercel", "netlify"] as const;
const NOTIFY_PROVIDERS = ["slack", "discord"] as const;
type SyncProvider = (typeof SYNC_PROVIDERS)[number];

type EnvFile = { id: string; name: string; syncTargets: Record<string, SyncTarget> };
type Connection = { provider: string; label: string | null };

export function IntegrationsPanel({
  workspaceId,
  isOwner,
  connections,
  envFiles,
  githubConnected,
  githubLogin,
}: {
  workspaceId: string;
  isOwner: boolean;
  connections: Connection[];
  envFiles: EnvFile[];
  githubConnected: boolean;
  githubLogin: string | null;
}) {
  const t = useTranslations("settingsIntegrations");
  const connectedByProvider = new Map(connections.map((c) => [c.provider, c]));
  const liveEntries = INTEGRATIONS_CATALOG.filter(
    (i) => i.status === "live" && (SYNC_PROVIDERS as readonly string[]).concat(NOTIFY_PROVIDERS).includes(i.slug)
  );

  if (!isOwner) {
    return <p className="text-sm text-body">{t("ownerOnly")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {liveEntries.map((entry) => {
        const connection = connectedByProvider.get(entry.slug);
        const isSync = (SYNC_PROVIDERS as readonly string[]).includes(entry.slug);
        return (
          <IntegrationRow
            key={entry.slug}
            workspaceId={workspaceId}
            slug={entry.slug}
            name={entry.name}
            description={entry.description}
            connection={connection ?? null}
            isSync={isSync}
            envFiles={envFiles}
            githubConnected={githubConnected}
            githubLogin={githubLogin}
          />
        );
      })}
    </div>
  );
}

function IntegrationRow({
  workspaceId,
  slug,
  name,
  description,
  connection,
  isSync,
  envFiles,
  githubConnected,
  githubLogin,
}: {
  workspaceId: string;
  slug: string;
  name: string;
  description: string;
  connection: Connection | null;
  isSync: boolean;
  envFiles: EnvFile[];
  githubConnected: boolean;
  githubLogin: string | null;
}) {
  const t = useTranslations("settingsIntegrations");
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState("");
  const [host, setHost] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [connected, setConnected] = useState(connection !== null);
  const [label, setLabel] = useState(connection?.label ?? null);

  function connect() {
    startTransition(async () => {
      const result =
        slug === "github-actions"
          ? await connectGithubActionsAction(workspaceId)
          : slug === "slack" || slug === "discord"
            ? await connectWebhookIntegrationAction(workspaceId, slug, webhookUrl)
            : await connectTokenIntegrationAction(workspaceId, slug as "gitlab" | "vercel" | "netlify", token, host);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConnected(true);
      setLabel(slug === "github-actions" ? githubLogin : null);
      setToken("");
      setWebhookUrl("");
      toast.success(t("connected", { name }));
    });
  }

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectIntegrationAction(
        workspaceId,
        slug as SyncProvider | "slack" | "discord"
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConnected(false);
      toast.success(t("disconnected", { name }));
    });
  }

  return (
    <div className="rounded-lg border border-hairline-strong bg-surface-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="flex items-center gap-2 text-[15px] font-medium text-foreground">
            {name}
            {connected ? <CheckCircle size={16} weight="fill" className="text-accent" /> : null}
          </span>
          <span className="text-[13px] text-mute">{description}</span>
          {connected && label ? <span className="mt-1 text-[12px] text-mute">{t("connectedAs", { label })}</span> : null}
        </div>
        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={isPending}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-hairline-strong px-3 py-1.5 text-[13px] font-medium text-body transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-60"
          >
            <Trash size={14} />
            {t("disconnect")}
          </button>
        ) : null}
      </div>

      {!connected ? (
        <div className="mt-4 flex flex-col gap-2">
          {slug === "github-actions" ? (
            githubConnected ? (
              <button
                type="button"
                onClick={connect}
                disabled={isPending}
                className="w-fit rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {t("connectGithubActions", { login: githubLogin ?? "" })}
              </button>
            ) : (
              <Link href="/profile" className="flex w-fit items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                {t("connectGithubFirst")}
                <ArrowSquareOut size={14} />
              </Link>
            )
          ) : slug === "slack" || slug === "discord" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder={t("webhookPlaceholder")}
                className="flex-1 rounded-md border border-hairline-strong bg-surface-elevated px-3 py-2 text-[14px] text-foreground outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={connect}
                disabled={isPending || !webhookUrl.trim()}
                className="shrink-0 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {t("connect")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t("tokenPlaceholder")}
                className="flex-1 rounded-md border border-hairline-strong bg-surface-elevated px-3 py-2 text-[14px] text-foreground outline-none focus:border-accent"
              />
              {slug === "gitlab" ? (
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder={t("gitlabHostPlaceholder")}
                  className="w-full rounded-md border border-hairline-strong bg-surface-elevated px-3 py-2 text-[14px] text-foreground outline-none focus:border-accent sm:w-48"
                />
              ) : null}
              <button
                type="button"
                onClick={connect}
                disabled={isPending || !token.trim()}
                className="shrink-0 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {t("connect")}
              </button>
            </div>
          )}
        </div>
      ) : isSync ? (
        <SyncControls workspaceId={workspaceId} provider={slug as SyncProvider} envFiles={envFiles} />
      ) : null}
    </div>
  );
}

function SyncControls({
  workspaceId,
  provider,
  envFiles,
}: {
  workspaceId: string;
  provider: SyncProvider;
  envFiles: EnvFile[];
}) {
  const t = useTranslations("settingsIntegrations");
  const [isPending, startTransition] = useTransition();
  const [envFileId, setEnvFileId] = useState(envFiles[0]?.id ?? "");
  const [targets, setTargets] = useState<SyncTarget[]>([]);
  const [targetId, setTargetId] = useState("");

  const selectedEnv = envFiles.find((f) => f.id === envFileId);
  const linkedTarget = selectedEnv?.syncTargets[provider] ?? null;

  function loadTargets() {
    startTransition(async () => {
      const result = await listSyncTargetsAction(workspaceId, provider);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTargets(result.targets);
      setTargetId(result.targets[0]?.id ?? "");
    });
  }

  function link() {
    const target = targets.find((tg) => tg.id === targetId);
    if (!target || !envFileId) return;
    startTransition(async () => {
      const result = await linkSyncTargetAction(envFileId, provider, target);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("targetLinked", { name: target.name }));
    });
  }

  function syncNow() {
    if (!envFileId) return;
    startTransition(async () => {
      const result = await syncEnvironmentAction(envFileId, provider);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("synced"));
    });
  }

  if (envFiles.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-hairline pt-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={envFileId}
          onChange={(e) => {
            setEnvFileId(e.target.value);
            setTargets([]);
            setTargetId("");
          }}
          className="flex-1 rounded-md border border-hairline-strong bg-surface-elevated px-3 py-2 text-[14px] text-foreground outline-none focus:border-accent"
        >
          {envFiles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={loadTargets}
          disabled={isPending}
          className="shrink-0 rounded-full border border-hairline-strong px-3 py-2 text-[13px] font-medium text-body hover:border-foreground/40 hover:text-foreground disabled:opacity-60"
        >
          {t("loadTargets")}
        </button>
      </div>

      {targets.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="flex-1 rounded-md border border-hairline-strong bg-surface-elevated px-3 py-2 text-[14px] text-foreground outline-none focus:border-accent"
          >
            {targets.map((tg) => (
              <option key={tg.id} value={tg.id}>
                {tg.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={link}
            disabled={isPending || !targetId}
            className="shrink-0 rounded-full border border-hairline-strong px-3 py-2 text-[13px] font-medium text-body hover:border-foreground/40 hover:text-foreground disabled:opacity-60"
          >
            {t("linkTarget")}
          </button>
        </div>
      ) : null}

      {linkedTarget ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-mute">{t("linkedTo", { name: linkedTarget.name })}</span>
          <button
            type="button"
            onClick={syncNow}
            disabled={isPending}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {t("syncNow")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
