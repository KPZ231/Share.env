"use client";

import { useState, useTransition } from "react";
import { acceptInvitationAction } from "@/app/[locale]/(app)/invite/[token]/accept-actions";

export function AcceptInviteForm({ token, acceptLabel }: { token: string; acceptLabel: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvitationAction(token);
      // acceptInvitationAction redirects on success (throws internally), so
      // reaching here means it returned an error result instead.
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={accept}
        disabled={isPending}
        className="rounded-full bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {acceptLabel}
      </button>
      {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
    </div>
  );
}
