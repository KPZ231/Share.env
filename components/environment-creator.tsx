"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { parseEnv, validatePairs } from "@/lib/env-format";
import { createEnvironmentAction } from "@/app/[locale]/(app)/environments/actions";
import { Spinner } from "@/components/spinner";
import { EnvPairsGrid, newRow, pairsFromRows, rowsFromPairs, type Row } from "@/components/env-pairs-grid";
import { EnvFileDropzone } from "@/components/env-file-dropzone";
import { GithubPanel } from "@/components/github-panel";

export function EnvironmentCreator({
  githubConnected,
  githubLogin,
}: {
  githubConnected: boolean;
  githubLogin: string | null;
}) {
  const t = useTranslations("environments.new");
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const nameId = useId();

  async function loadFile(file: File) {
    const text = await file.text();
    const parsed = parseEnv(text);
    if (parsed.length > 0) setRows(rowsFromPairs(parsed));
    if (!name) setName(file.name.replace(/\.env$/, "") || file.name);
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t("errors.nameRequired"));
      return;
    }

    const pairs = pairsFromRows(rows);
    if (pairs.length === 0) {
      toast.error(t("errors.emptyPairs"));
      return;
    }

    const validation = validatePairs(pairs);
    if (!validation.ok) {
      toast.error(validation.errors[0]?.message ?? t("errors.generic"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await createEnvironmentAction({
          name: trimmedName,
          pairs,
          githubOwner: selectedRepo?.owner,
          githubRepo: selectedRepo?.name,
        });
        if (!result.ok) throw new Error(result.error);
        toast.success(t("success"));
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("errors.generic"));
      }
    });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-6 rounded-lg border border-hairline-strong bg-surface-soft p-6 lg:p-8">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
            {t("nameLabel")}
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={100}
            className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground"
          />
        </div>

        <div className="flex gap-2 rounded-full border border-hairline bg-background p-1 text-[13px] font-medium">
          {(["manual", "upload"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full px-4 py-2 transition-colors ${
                mode === m ? "bg-foreground text-background" : "text-mute hover:text-foreground"
              }`}
            >
              {m === "manual" ? t("modeManual") : t("modeUpload")}
            </button>
          ))}
        </div>

        {mode === "upload" ? (
          <EnvFileDropzone
            onFile={(file) => void loadFile(file)}
            hint={t("dropHint")}
            activeHint={t("dropActive")}
            fileTypeError={t("errors.fileType")}
            fileSizeError={t("errors.fileSize")}
          />
        ) : null}

        {(mode === "manual" || rows.some((r) => r.key || r.value)) && (
          <EnvPairsGrid rows={rows} setRows={setRows} onSubmit={() => void handleSubmit()} />
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <Spinner className="size-4" />}
            {isPending ? t("submitting") : t("submit")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            disabled={isPending}
            className="text-[15px] font-medium text-mute hover:text-foreground disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        </div>
      </div>

      <GithubPanel
        mode="create"
        connected={githubConnected}
        githubLogin={githubLogin}
        selectedRepo={selectedRepo}
        onSelectRepo={setSelectedRepo}
      />
    </div>
  );
}
