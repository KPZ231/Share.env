"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Check, Copy } from "@phosphor-icons/react";
import type { WorkspaceRole } from "@prisma/client";
import { WorkspaceLogoUploader } from "@/components/settings/workspace-logo-uploader";
import { updateWorkspaceAction } from "@/app/[locale]/(app)/settings/actions";
import { inviteByEmailAction, createInviteLinkAction } from "@/app/[locale]/(app)/members/actions";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Link } from "@/i18n/navigation";

const NAME_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 280;

// Matches components/members-panel.tsx's tokens: solid surface + strong border
// so form controls read clearly against the page background instead of blending into it.
const cardClass = "rounded-lg border border-hairline-strong bg-surface-soft p-6";
const inputClass =
  "w-full rounded-lg border border-hairline-strong bg-surface-elevated px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-accent";
const buttonClass =
  "shrink-0 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40";
const subtleButtonClass =
  "shrink-0 rounded-full border border-hairline-strong px-4 py-2.5 text-[13px] font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-40";

export function WorkspaceSettingsPanel({
  workspaceId,
  name: initialName,
  description: initialDescription,
  logoUrl,
}: {
  workspaceId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
}) {
  const t = useTranslations("settings");
  const roleT = useTranslations("members.roles");
  const dashboardT = useTranslations("dashboard.breadcrumbs");
  const locale = useLocale();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await updateWorkspaceAction(workspaceId, { name, description });
      if (!result.ok) throw new Error(result.error);
      toast.success(t("general.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Breadcrumbs items={[{ label: dashboardT("dashboard"), href: "/dashboard" }, { label: t("breadcrumb") }]} />

      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-2 text-[15px] text-body">{t("subheading")}</p>
      </div>

      <form onSubmit={handleSave} className={`flex flex-col gap-6 ${cardClass}`}>
        <h2 className="text-[15px] font-semibold text-foreground">{t("general.title")}</h2>

        <WorkspaceLogoUploader workspaceId={workspaceId} name={name} initialLogoUrl={logoUrl} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="workspaceName" className="text-sm font-medium text-foreground">
            {t("general.name")}
          </label>
          <input
            id="workspaceName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX_LENGTH}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="workspaceDescription" className="text-sm font-medium text-foreground">
              {t("general.description")}
            </label>
            <span className="text-[13px] text-body">
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="workspaceDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
            rows={3}
            placeholder={t("general.descriptionPlaceholder")}
            className={`resize-none ${inputClass}`}
          />
        </div>

        <button type="submit" disabled={saving} className={`self-start ${buttonClass}`}>
          {saving ? t("general.saving") : t("general.save")}
        </button>
      </form>

      <QuickInvite workspaceId={workspaceId} locale={locale} t={t} roleT={roleT} />

      <WorkspaceIdCard workspaceId={workspaceId} t={t} />
    </div>
  );
}

function QuickInvite({
  workspaceId,
  locale,
  t,
  roleT,
}: {
  workspaceId: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  roleT: ReturnType<typeof useTranslations>;
}) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  function sendEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteByEmailAction(workspaceId, email, role, locale);
      if (!result.ok) setError(result.error);
      else {
        toast.success(t("quickInvite.sent"));
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

  return (
    <div className={`flex flex-col gap-4 ${cardClass}`}>
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">{t("quickInvite.title")}</h2>
        <p className="mt-1 text-[13px] text-body">{t("quickInvite.subtitle")}</p>
      </div>

      <form onSubmit={sendEmailInvite} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("quickInvite.emailPlaceholder")}
          className={`sm:flex-1 ${inputClass}`}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as WorkspaceRole)}
          className="rounded-lg border border-hairline-strong bg-surface-elevated px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-accent"
        >
          <option value="viewer">{roleT("viewer")}</option>
          <option value="editor">{roleT("editor")}</option>
        </select>
        <button type="submit" disabled={isPending} className={buttonClass}>
          {t("quickInvite.send")}
        </button>
      </form>

      <button type="button" onClick={createLink} disabled={isPending} className={`self-start ${subtleButtonClass}`}>
        {t("quickInvite.createLink")}
      </button>

      {linkUrl && (
        <div className="rounded-lg border border-hairline-strong bg-surface-elevated p-3">
          <code className="block break-all text-[13px] text-foreground">{linkUrl}</code>
        </div>
      )}
      {error && <p className="text-[13px] font-medium text-red-400">{error}</p>}

      <Link href="/members" className="self-start text-[13px] font-medium text-body underline underline-offset-2 hover:text-foreground">
        {t("quickInvite.manageAll")}
      </Link>
    </div>
  );
}

function WorkspaceIdCard({ workspaceId, t }: { workspaceId: string; t: ReturnType<typeof useTranslations> }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(workspaceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`flex items-center justify-between gap-4 ${cardClass}`}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[14px] font-medium text-foreground">{t("workspaceId.title")}</span>
        <code className="truncate text-[13px] text-body">{workspaceId}</code>
      </div>
      <button type="button" onClick={copy} className={`flex items-center gap-2 ${subtleButtonClass}`}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? t("workspaceId.copied") : t("workspaceId.copy")}
      </button>
    </div>
  );
}
