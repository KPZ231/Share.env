"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { parseEnv, validatePairs, type EnvPair } from "@/lib/env-format";
import { updateEnvironmentAction } from "@/app/[locale]/(app)/environments/actions";
import { Spinner } from "@/components/spinner";
import { EnvPairsGrid, pairsFromRows, rowsFromPairs, type Row } from "@/components/env-pairs-grid";
import { EnvFileDropzone } from "@/components/env-file-dropzone";

export function EnvironmentEditor({
  id,
  initialName,
  initialPairs,
  initialDescription,
  initialWebsiteUrl,
  readOnly,
}: {
  id: string;
  initialName: string;
  initialPairs: EnvPair[];
  initialDescription: string | null;
  initialWebsiteUrl: string | null;
  readOnly: boolean;
}) {
  const t = useTranslations("environments");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? "");
  const [rows, setRows] = useState<Row[]>(() => rowsFromPairs(initialPairs));
  const [isPending, startTransition] = useTransition();
  const nameId = useId();
  const descriptionId = useId();
  const websiteId = useId();

  async function loadFile(file: File) {
    const text = await file.text();
    const parsed = parseEnv(text);
    if (parsed.length > 0) {
      setRows(rowsFromPairs(parsed));
      toast.success(t("new.bulkImported", { count: parsed.length }));
    }
  }

  async function handleSubmit() {
    if (readOnly) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t("new.errors.nameRequired"));
      return;
    }

    const pairs = pairsFromRows(rows);
    if (pairs.length === 0) {
      toast.error(t("new.errors.emptyPairs"));
      return;
    }

    const validation = validatePairs(pairs);
    if (!validation.ok) {
      toast.error(validation.errors[0]?.message ?? t("new.errors.generic"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateEnvironmentAction({ id, name: trimmedName, pairs, description, websiteUrl });
        if (!result.ok) throw new Error(result.error);
        toast.success(t("detail.success"));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("new.errors.generic"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-hairline-strong bg-surface-soft p-6 lg:p-8">
      {readOnly && (
        <p className="rounded-md border border-hairline bg-background px-4 py-2.5 text-[13px] text-mute">
          {t("detail.readOnlyNotice")}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
          {t("new.nameLabel")}
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          readOnly={readOnly}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground read-only:opacity-70"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={websiteId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
            {t("detail.websiteLabel")}
          </label>
          <input
            id={websiteId}
            type="url"
            value={websiteUrl}
            readOnly={readOnly}
            placeholder="https://"
            onChange={(e) => setWebsiteUrl(e.target.value)}
            maxLength={500}
            className="rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground read-only:opacity-70"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={descriptionId} className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
          {t("detail.descriptionLabel")}
        </label>
        <textarea
          id={descriptionId}
          value={description}
          readOnly={readOnly}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          className="resize-none rounded-md border border-hairline bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors focus:border-foreground read-only:opacity-70"
        />
      </div>

      {!readOnly && (
        <EnvFileDropzone
          onFile={(file) => void loadFile(file)}
          hint={t("detail.replaceHint")}
          activeHint={t("new.dropActive")}
          fileTypeError={t("new.errors.fileType")}
          fileSizeError={t("new.errors.fileSize")}
        />
      )}

      <EnvPairsGrid rows={rows} setRows={setRows} onSubmit={() => void handleSubmit()} readOnly={readOnly} />

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <Spinner className="size-4" />}
            {isPending ? t("detail.saving") : t("detail.save")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/environments")}
            disabled={isPending}
            className="text-[15px] font-medium text-mute hover:text-foreground disabled:opacity-50"
          >
            {t("new.cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
