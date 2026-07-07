"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { WorkspaceRole } from "@prisma/client";
import {
  changeRoleAction,
  removeMemberAction,
  regenerateAccessKeyAction,
  setMemberEnvVisibilityAction,
  inviteByEmailAction,
  createInviteLinkAction,
  revokeInviteAction,
} from "@/app/[locale]/(app)/members/actions";

type Member = {
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  hasAccessKey: boolean;
  accessKeyUpdatedAt: string | null;
  displayName: string | null;
};

type EnvFile = { id: string; name: string };

type PendingInvite = {
  id: string;
  kind: "email" | "link";
  email: string | null;
  role: WorkspaceRole;
  expiresAt: string;
};

const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];
const inputClass =
  "w-full rounded-lg border border-hairline-strong bg-surface-soft px-3.5 py-2.5 text-[14px] text-foreground outline-none transition-colors focus:border-accent";
const cardClass = "rounded-lg border border-hairline-strong bg-surface-soft p-6";
const buttonClass =
  "shrink-0 rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40";
const subtleButtonClass =
  "shrink-0 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-40";

export function MembersPanel({
  workspaceId,
  currentUserId,
  isOwner,
  members,
  envFiles,
  hiddenMap,
  pendingInvites,
}: {
  workspaceId: string;
  currentUserId: string;
  isOwner: boolean;
  members: Member[];
  envFiles: EnvFile[];
  hiddenMap: Record<string, string[]>;
  pendingInvites: PendingInvite[];
}) {
  const t = useTranslations("members");
  const roleT = useTranslations("dashboard.roles");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface-soft">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            workspaceId={workspaceId}
            member={member}
            isSelf={member.userId === currentUserId}
            isOwnerViewer={isOwner}
            envFiles={envFiles}
            hiddenIds={new Set(hiddenMap[member.userId] ?? [])}
            t={t}
            roleT={roleT}
          />
        ))}
      </ul>

      {isOwner && (
        <InviteSection
          workspaceId={workspaceId}
          locale={locale}
          pendingInvites={pendingInvites}
          t={t}
          roleT={roleT}
        />
      )}
    </div>
  );
}

function MemberRow({
  workspaceId,
  member,
  isSelf,
  isOwnerViewer,
  envFiles,
  hiddenIds,
  t,
  roleT,
}: {
  workspaceId: string;
  member: Member;
  isSelf: boolean;
  isOwnerViewer: boolean;
  envFiles: EnvFile[];
  hiddenIds: Set<string>;
  t: ReturnType<typeof useTranslations>;
  roleT: ReturnType<typeof useTranslations>;
}) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(member.role);
  const [hidden, setHidden] = useState(hiddenIds);
  const [showVisibility, setShowVisibility] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const canManage = isOwnerViewer && !isSelf;

  function saveRole() {
    setError(null);
    startTransition(async () => {
      const result = await changeRoleAction(workspaceId, member.userId, role);
      if (!result.ok) setError(result.error);
    });
  }

  function remove() {
    if (!window.confirm(t("removeConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, member.userId);
      if (!result.ok) setError(result.error);
      else setRemoved(true);
    });
  }

  function regenerateKey() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateAccessKeyAction(workspaceId, member.userId);
      if (!result.ok) setError(result.error);
      else if (result.accessKey) setGeneratedKey(result.accessKey);
    });
  }

  function toggleVisibility(envFileId: string, visible: boolean) {
    startTransition(async () => {
      const next = new Set(hidden);
      if (visible) next.delete(envFileId);
      else next.add(envFileId);
      setHidden(next);
      await setMemberEnvVisibilityAction(workspaceId, member.userId, envFileId, !visible);
    });
  }

  async function copyKey() {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (removed) return null;

  return (
    <li className="flex flex-col gap-3 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/u/${member.userId}`} className="truncate text-[14px] font-medium text-foreground hover:text-accent">
          {member.displayName || t("unnamed")}
          {isSelf && <span className="ml-1.5 text-mute">{t("you")}</span>}
        </Link>

        <div className="flex items-center gap-2">
          {canManage ? (
            <>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                className="rounded-full border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-[13px] text-foreground"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleT(r)}
                  </option>
                ))}
              </select>
              {role !== member.role && (
                <button type="button" onClick={saveRole} disabled={isPending} className={buttonClass}>
                  {t("save")}
                </button>
              )}
              <button type="button" onClick={remove} disabled={isPending} className={subtleButtonClass}>
                {t("remove")}
              </button>
            </>
          ) : (
            <span className="rounded-full border border-hairline-strong px-3 py-1.5 text-[13px] text-body">
              {roleT(member.role)}
            </span>
          )}
        </div>
      </div>

      {isOwnerViewer && (
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-mute">
          <span>
            {member.hasAccessKey && member.accessKeyUpdatedAt
              ? t("accessKey.set", { date: new Date(member.accessKeyUpdatedAt).toLocaleDateString() })
              : t("accessKey.none")}
          </span>
          <button type="button" onClick={regenerateKey} disabled={isPending} className="text-accent hover:underline">
            {member.hasAccessKey ? t("accessKey.regenerate") : t("accessKey.generate")}
          </button>
          {!isSelf && (
            <button type="button" onClick={() => setShowVisibility((v) => !v)} className="text-accent hover:underline">
              {t("visibility.toggle")}
            </button>
          )}
        </div>
      )}

      {error && <p className="text-[13px] text-red-500">{error}</p>}

      {showVisibility && (
        <div className="rounded-lg border border-hairline bg-surface-elevated p-4">
          <p className="mb-2 text-[12px] text-mute">{t("visibility.hint")}</p>
          {envFiles.length === 0 ? (
            <p className="text-[13px] text-body">{t("visibility.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {envFiles.map((f) => (
                <li key={f.id} className="flex items-center gap-2">
                  <input
                    id={`vis-${member.userId}-${f.id}`}
                    type="checkbox"
                    checked={!hidden.has(f.id)}
                    onChange={(e) => toggleVisibility(f.id, e.target.checked)}
                  />
                  <label htmlFor={`vis-${member.userId}-${f.id}`} className="text-[13px] text-body">
                    {f.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog">
          <div className="w-full max-w-sm rounded-lg border border-hairline-strong bg-surface-soft p-6">
            <h3 className="text-[15px] font-medium text-foreground">{t("accessKey.modalTitle")}</h3>
            <p className="mt-1 text-[13px] text-mute">{t("accessKey.modalHint")}</p>
            <code className="mt-4 block break-all rounded-lg border border-hairline-strong bg-surface-elevated p-3 text-[13px] text-foreground">
              {generatedKey}
            </code>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={copyKey} className={subtleButtonClass}>
                {copied ? t("accessKey.copied") : t("accessKey.copy")}
              </button>
              <button type="button" onClick={() => setGeneratedKey(null)} className={buttonClass}>
                {t("accessKey.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function InviteSection({
  workspaceId,
  locale,
  pendingInvites,
  t,
  roleT,
}: {
  workspaceId: string;
  locale: string;
  pendingInvites: PendingInvite[];
  t: ReturnType<typeof useTranslations>;
  roleT: ReturnType<typeof useTranslations>;
}) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [invites, setInvites] = useState(pendingInvites);

  function sendEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailSent(false);
    startTransition(async () => {
      const result = await inviteByEmailAction(workspaceId, email, role, locale);
      if (!result.ok) setError(result.error);
      else {
        setEmailSent(true);
        setEmail("");
      }
    });
  }

  function createLink() {
    setError(null);
    startTransition(async () => {
      const result = await createInviteLinkAction(workspaceId, role, locale);
      if (!result.ok) setError(result.error);
      else if (result.url) setLinkUrl(result.url);
    });
  }

  function revoke(id: string) {
    startTransition(async () => {
      await revokeInviteAction(workspaceId, id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
    });
  }

  return (
    <div className={cardClass}>
      <h2 className="text-[15px] font-medium text-foreground">{t("invite.heading")}</h2>

      <form onSubmit={sendEmailInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("invite.emailPlaceholder")}
          className={inputClass}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as WorkspaceRole)}
          className="rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2.5 text-[14px] text-foreground"
        >
          {ROLES.filter((r) => r !== "owner").map((r) => (
            <option key={r} value={r}>
              {roleT(r)}
            </option>
          ))}
        </select>
        <button type="submit" disabled={isPending} className={buttonClass}>
          {t("invite.sendEmail")}
        </button>
      </form>
      {emailSent && <p className="mt-2 text-[13px] text-accent">{t("invite.linkCreated")}</p>}

      <div className="mt-4 flex items-center gap-3">
        <span className="text-[13px] text-mute">{t("invite.orDivider")}</span>
        <button type="button" onClick={createLink} disabled={isPending} className={subtleButtonClass}>
          {t("invite.createLink")}
        </button>
      </div>

      {linkUrl && (
        <div className="mt-3 rounded-lg border border-hairline bg-surface-elevated p-3">
          <p className="text-[12px] text-mute">{t("invite.linkHint", { role: roleT(role) })}</p>
          <code className="mt-1 block break-all text-[13px] text-foreground">{linkUrl}</code>
        </div>
      )}

      {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}

      <h3 className="mt-6 text-[13px] font-medium text-body">{t("invite.pendingHeading")}</h3>
      {invites.length === 0 ? (
        <p className="mt-1 text-[13px] text-mute">{t("invite.pendingEmpty")}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-3 text-[13px] text-body">
              <span className="truncate">
                {invite.kind === "email" ? invite.email : t("invite.createLink")} · {roleT(invite.role)} ·{" "}
                {t("invite.expiresAt", { date: new Date(invite.expiresAt).toLocaleDateString() })}
              </span>
              <button type="button" onClick={() => revoke(invite.id)} className="shrink-0 text-accent hover:underline">
                {t("invite.revoke")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
