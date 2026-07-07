"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Camera, Trash, SpinnerGap } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { confirmAvatarAction, removeAvatarAction } from "@/app/[locale]/(app)/profile/actions";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function initialsFrom(displayName: string, email: string) {
  const source = displayName.trim() || email;
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function AvatarUploader({
  userId,
  displayName,
  email,
  initialAvatarUrl,
}: {
  userId: string;
  displayName: string;
  email: string;
  initialAvatarUrl: string | null;
}) {
  const t = useTranslations("profile.avatar");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t("errors.type"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("errors.size"));
      return;
    }

    setBusy(true);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const result = await confirmAvatarAction(path);
      if (!result.ok) throw new Error(result.error);

      toast.success(t("success"));
    } catch {
      toast.error(t("errors.generic"));
      setPreview(initialAvatarUrl);
    } finally {
      setBusy(false);
      URL.revokeObjectURL(localUrl);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      const result = await removeAvatarAction();
      if (!result.ok) throw new Error(result.error);
      setPreview(null);
      toast.success(t("removed"));
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <div className="h-20 w-20 overflow-hidden rounded-full border border-hairline-strong bg-surface-soft">
          {preview ? (
            // Signed URLs expire; this is a snapshot for the current session, not a long-lived <Image>.
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-medium text-foreground">
              {initialsFrom(displayName, email)}
            </div>
          )}
        </div>

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
            <SpinnerGap size={20} className="animate-spin text-foreground" />
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={t("change")}
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-hairline-strong bg-foreground text-background transition-transform active:scale-90 disabled:pointer-events-none"
        >
          <Camera size={14} weight="fill" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex gap-3 text-[13px]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="font-medium text-foreground underline underline-offset-2 hover:no-underline disabled:opacity-50"
          >
            {t("change")}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="flex items-center gap-1 text-mute hover:text-foreground disabled:opacity-50"
            >
              <Trash size={14} />
              {t("remove")}
            </button>
          )}
        </div>
        <p className="text-[12px] text-mute">{t("hint")}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
