"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DownloadSimple, SpinnerGap, Warning } from "@phosphor-icons/react";
import type { Profile } from "@/lib/profile";
import type { TwoFactorStatus } from "@/lib/two-factor";
import type { GithubConnectionInfo } from "@/lib/github-connection";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { IntegrationsSearch } from "@/components/profile/integrations-search";
import { TwoFactorSection } from "@/components/profile/two-factor-section";
import { GithubConnectionSection } from "@/components/profile/github-connection-section";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  updateProfileAction,
  updateConsentAction,
  exportDataAction,
  deleteAccountAction,
} from "@/app/[locale]/(app)/profile/actions";

const BIO_MAX_LENGTH = 280;

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-foreground" : "bg-surface-soft border border-hairline-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function ProfileView({
  profile,
  email,
  avatarUrl,
  twoFactorStatus,
  githubConnection,
}: {
  profile: Profile;
  email: string;
  avatarUrl: string | null;
  twoFactorStatus: TwoFactorStatus;
  githubConnection: GithubConnectionInfo | null;
}) {
  const t = useTranslations("profile");
  const tDashboard = useTranslations("dashboard");

  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [marketingConsent, setMarketingConsent] = useState(profile.marketingConsent);
  const [productEmailsConsent, setProductEmailsConsent] = useState(profile.productEmailsConsent);

  const [exporting, setExporting] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const result = await updateProfileAction({ displayName, bio });
      if (!result.ok) throw new Error(result.error);
      toast.success(t("basics.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleConsentChange(next: { marketingConsent: boolean; productEmailsConsent: boolean }) {
    setMarketingConsent(next.marketingConsent);
    setProductEmailsConsent(next.productEmailsConsent);
    const result = await updateConsentAction(next);
    if (!result.ok) toast.error(result.error);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportDataAction();
      if (!result.ok) throw new Error(result.error);
      const blob = new Blob([result.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "share-env-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    try {
      const result = await deleteAccountAction(deleteEmailInput);
      if (result && !result.ok) {
        toast.error(result.error);
        setDeleting(false);
      }
      // On success the action redirects and this component unmounts.
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: tDashboard("breadcrumbs.dashboard"), href: "/dashboard" },
          { label: tDashboard("breadcrumbs.profile") },
        ]}
      />

      <div className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("heading")}</h1>
        <p className="text-[14px] text-mute">{t("subheading")}</p>
      </div>

      <form
        onSubmit={handleSaveProfile}
        className="mt-10 flex flex-col gap-6 rounded-lg border border-hairline-strong bg-surface-soft p-6"
      >
        <h2 className="text-[15px] font-semibold text-foreground">{t("basics.title")}</h2>

        <AvatarUploader
          userId={profile.userId}
          displayName={displayName}
          email={email}
          initialAvatarUrl={avatarUrl}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="text-sm font-medium text-foreground">
            {t("basics.displayName")}
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            placeholder={email}
            className="rounded-md border border-hairline-strong bg-surface-elevated px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="bio" className="text-sm font-medium text-foreground">
              {t("basics.bio")}
            </label>
            <span className="text-[13px] text-body">
              {bio.length}/{BIO_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
            rows={3}
            placeholder={t("basics.bioPlaceholder")}
            className="resize-none rounded-md border border-hairline-strong bg-surface-elevated px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-accent"
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="self-start rounded-full bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-transform active:scale-95 disabled:opacity-60"
        >
          {savingProfile ? t("basics.saving") : t("basics.save")}
        </button>
      </form>

      <div className="mt-10 flex flex-col gap-4 rounded-lg border border-hairline-strong bg-surface-soft p-6">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{t("integrations.title")}</h2>
          <p className="text-[13px] text-body">{t("integrations.subtitle")}</p>
        </div>
        <IntegrationsSearch initialInterested={profile.interestedIntegrations} />
      </div>

      <GithubConnectionSection connection={githubConnection} />

      <TwoFactorSection status={twoFactorStatus} />

      <div className="mt-10 flex flex-col gap-5 rounded-lg border border-hairline-strong bg-surface-soft p-6">
        <h2 className="text-[15px] font-semibold text-foreground">{t("privacy.title")}</h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[14px] text-foreground">{t("privacy.productEmails")}</span>
            <span className="text-[13px] text-body">{t("privacy.productEmailsHint")}</span>
          </div>
          <Switch
            checked={productEmailsConsent}
            label={t("privacy.productEmails")}
            onChange={(next) => handleConsentChange({ marketingConsent, productEmailsConsent: next })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[14px] text-foreground">{t("privacy.marketing")}</span>
            <span className="text-[13px] text-body">{t("privacy.marketingHint")}</span>
          </div>
          <Switch
            checked={marketingConsent}
            label={t("privacy.marketing")}
            onChange={(next) => handleConsentChange({ marketingConsent: next, productEmailsConsent })}
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-hairline-strong pt-5">
          <div className="flex flex-col">
            <span className="text-[14px] text-foreground">{t("privacy.export")}</span>
            <span className="text-[13px] text-body">{t("privacy.exportHint")}</span>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex shrink-0 items-center gap-2 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/40 disabled:opacity-60"
          >
            {exporting ? <SpinnerGap size={14} className="animate-spin" /> : <DownloadSimple size={14} />}
            {t("privacy.exportAction")}
          </button>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 rounded-lg border border-hairline-strong bg-surface-soft p-6">
        <h2 className="text-[15px] font-semibold text-foreground">{t("danger.title")}</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[14px] text-foreground">{t("danger.deleteAccount")}</span>
            <span className="text-[13px] text-body">{t("danger.deleteAccountHint")}</span>
          </div>
          {!confirmingDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="shrink-0 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-red-500/60 hover:text-red-500"
            >
              {t("danger.deleteAction")}
            </button>
          )}
        </div>

        {confirmingDelete && (
          <form
            onSubmit={handleDeleteAccount}
            className="flex flex-col gap-3 rounded-md border border-red-500/30 bg-red-500/5 p-4"
          >
            <p className="flex items-start gap-2 text-[13px] text-foreground">
              <Warning size={16} className="mt-0.5 shrink-0 text-red-500" weight="fill" />
              {t.rich("danger.confirmPrompt", { email: () => <strong>{email}</strong> })}
            </p>
            <input
              type="email"
              value={deleteEmailInput}
              onChange={(e) => setDeleteEmailInput(e.target.value)}
              placeholder={email}
              autoComplete="off"
              className="rounded-md border border-hairline-strong bg-surface-elevated px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-red-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={deleting || deleteEmailInput.trim().toLowerCase() !== email.toLowerCase()}
                className="rounded-full bg-red-600 px-4 py-2 text-[13px] font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
              >
                {deleting ? t("danger.deleting") : t("danger.confirmAction")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteEmailInput("");
                }}
                disabled={deleting}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-mute hover:text-foreground"
              >
                {t("danger.cancel")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
