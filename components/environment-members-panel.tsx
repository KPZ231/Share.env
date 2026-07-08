"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Users } from "@phosphor-icons/react";
import { setMemberEnvVisibilityAction } from "@/app/[locale]/(app)/members/actions";

export function EnvironmentMembersPanel({
  workspaceId,
  envFileId,
  members,
  initialHiddenUserIds,
}: {
  workspaceId: string;
  envFileId: string;
  members: { userId: string; role: "owner" | "editor" | "viewer"; displayName: string | null }[];
  initialHiddenUserIds: string[];
}) {
  const t = useTranslations("environments.detail.assignedMembers");
  const roleT = useTranslations("members.roles");
  const [hidden, setHidden] = useState(() => new Set(initialHiddenUserIds));
  const [isPending, startTransition] = useTransition();

  function toggle(userId: string, assigned: boolean) {
    const next = new Set(hidden);
    if (assigned) next.delete(userId);
    else next.add(userId);
    setHidden(next);
    startTransition(async () => {
      const result = await setMemberEnvVisibilityAction(workspaceId, userId, envFileId, !assigned);
      if (!result.ok) {
        toast.error(result.error);
        setHidden(hidden);
      }
    });
  }

  const assignable = members.filter((m) => m.role !== "owner");

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-6">
      <div className="flex items-center gap-2.5">
        <Users size={18} className="text-mute" />
        <div>
          <p className="text-[14px] font-medium text-foreground">{t("heading")}</p>
          <p className="text-[12px] text-mute">{t("hint")}</p>
        </div>
      </div>

      {assignable.length === 0 ? (
        <p className="text-[13px] text-mute">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {assignable.map((m) => {
            const assigned = !hidden.has(m.userId);
            return (
              <li key={m.userId} className="flex items-center justify-between gap-2 py-1">
                <label htmlFor={`assign-${m.userId}`} className="flex flex-col text-[13px] text-body">
                  <span className="text-foreground">{m.displayName || t("unnamed")}</span>
                  <span className="text-[12px] text-mute">{roleT(m.role)}</span>
                </label>
                <input
                  id={`assign-${m.userId}`}
                  type="checkbox"
                  checked={assigned}
                  disabled={isPending}
                  onChange={(e) => toggle(m.userId, e.target.checked)}
                  className="size-4 accent-foreground"
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
