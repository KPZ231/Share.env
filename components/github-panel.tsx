"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { GithubLogo, GitCommit, LinkBreak } from "@phosphor-icons/react";
import { Spinner } from "@/components/spinner";
import type { GithubRepo, GithubCommit } from "@/lib/github";
import {
  listMyGithubReposAction,
  previewRepoCommitsAction,
  linkEnvironmentRepoAction,
  unlinkEnvironmentRepoAction,
  disconnectGithubAction,
} from "@/app/[locale]/(app)/environments/github-actions";

type LinkedRepo = { owner: string; name: string };

type Props =
  | {
      mode: "create";
      connected: boolean;
      githubLogin: string | null;
      selectedRepo: LinkedRepo | null;
      onSelectRepo: (repo: LinkedRepo | null) => void;
    }
  | {
      mode: "view";
      connected: boolean;
      githubLogin: string | null;
      envFileId: string;
      linkedRepo: LinkedRepo | null;
      canManage: boolean;
    };

export function GithubPanel(props: Props) {
  const t = useTranslations("environments.github");
  const locale = useLocale();
  const [repos, setRepos] = useState<GithubRepo[] | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [commits, setCommits] = useState<GithubCommit[] | null>(null);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [isPending, startTransition] = useTransition();

  const linkedRepo = props.mode === "view" ? props.linkedRepo : props.selectedRepo;
  const canManage = props.mode === "create" ? true : props.canManage;

  useEffect(() => {
    if (!linkedRepo) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-dependency-change loading flag
    setLoadingCommits(true);
    previewRepoCommitsAction(linkedRepo.owner, linkedRepo.name)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setCommits(result.commits);
        else toast.error(result.error);
      })
      .finally(() => {
        if (!cancelled) setLoadingCommits(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitive fields are the correct dep, not the whole object
  }, [linkedRepo?.owner, linkedRepo?.name]);

  function openPicker() {
    setPickerOpen(true);
    if (repos) return;
    setLoadingRepos(true);
    listMyGithubReposAction()
      .then((result) => {
        if (result.ok) setRepos(result.repos);
        else toast.error(result.error);
      })
      .finally(() => setLoadingRepos(false));
  }

  function pickRepo(repo: GithubRepo) {
    const next = { owner: repo.owner, name: repo.name };
    setPickerOpen(false);
    if (props.mode === "create") {
      props.onSelectRepo(next);
      return;
    }
    startTransition(async () => {
      const result = await linkEnvironmentRepoAction(props.envFileId, next.owner, next.name);
      if (!result.ok) toast.error(result.error);
    });
  }

  function unlinkRepo() {
    if (props.mode === "create") {
      props.onSelectRepo(null);
      return;
    }
    startTransition(async () => {
      const result = await unlinkEnvironmentRepoAction(props.envFileId);
      if (!result.ok) toast.error(result.error);
    });
  }

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectGithubAction();
      if (!result.ok) toast.error(result.error);
    });
  }

  if (!props.connected) {
    const returnTo = typeof window !== "undefined" ? window.location.pathname : "";
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-5">
        <div className="flex items-center gap-2.5">
          <GithubLogo size={18} className="text-foreground" />
          <p className="text-[14px] font-medium text-foreground">{t("title")}</p>
        </div>
        <p className="text-[12px] text-mute">{t("connectHint")}</p>
        <a
          href={`/${locale}/auth/github/connect${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
          className="flex items-center justify-center gap-2 rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground"
        >
          <GithubLogo size={15} weight="fill" />
          {t("connect")}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <GithubLogo size={18} className="text-foreground" />
          <p className="text-[14px] font-medium text-foreground">{t("title")}</p>
        </div>
        {props.githubLogin && (
          <button
            type="button"
            onClick={disconnect}
            disabled={isPending}
            className="text-[11px] text-mute hover:text-foreground disabled:opacity-50"
          >
            {t("connectedAs", { login: props.githubLogin })}
          </button>
        )}
      </div>

      {!linkedRepo ? (
        canManage ? (
          <>
            <p className="text-[12px] text-mute">{t("pickHint")}</p>
            {!pickerOpen ? (
              <button
                type="button"
                onClick={openPicker}
                className="rounded-full border border-hairline-strong px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground"
              >
                {t("chooseRepo")}
              </button>
            ) : loadingRepos ? (
              <div className="flex items-center gap-2 py-2 text-[13px] text-mute">
                <Spinner className="size-4" />
                {t("loadingRepos")}
              </div>
            ) : (
              <ul className="flex max-h-48 flex-col divide-y divide-hairline overflow-y-auto rounded-md border border-hairline">
                {(repos ?? []).map((repo) => (
                  <li key={repo.fullName}>
                    <button
                      type="button"
                      onClick={() => pickRepo(repo)}
                      className="w-full truncate px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-elevated"
                    >
                      {repo.fullName}
                    </button>
                  </li>
                ))}
                {repos?.length === 0 && (
                  <li className="px-3 py-2 text-[13px] text-mute">{t("noRepos")}</li>
                )}
              </ul>
            )}
          </>
        ) : (
          <p className="text-[12px] text-mute">{t("noRepoLinked")}</p>
        )
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-[12px] text-foreground">
              {linkedRepo.owner}/{linkedRepo.name}
            </span>
            {canManage && (
              <button
                type="button"
                onClick={unlinkRepo}
                disabled={isPending}
                aria-label={t("unlink")}
                className="shrink-0 rounded-md p-1.5 text-mute hover:text-foreground disabled:opacity-50"
              >
                <LinkBreak size={14} />
              </button>
            )}
          </div>

          {loadingCommits ? (
            <div className="flex items-center gap-2 py-2 text-[13px] text-mute">
              <Spinner className="size-4" />
              {t("loadingCommits")}
            </div>
          ) : commits && commits.length > 0 ? (
            <ul className="flex flex-col divide-y divide-hairline">
              {commits.map((commit) => (
                <li key={commit.sha} className="flex items-start gap-2 py-2.5">
                  <GitCommit size={14} className="mt-0.5 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-[13px] text-foreground hover:underline"
                    >
                      {commit.message}
                    </a>
                    <p className="text-[11px] text-mute">
                      {commit.authorName} · {commit.date ? new Date(commit.date).toLocaleDateString() : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-mute">{t("noCommits")}</p>
          )}
        </>
      )}
    </div>
  );
}
