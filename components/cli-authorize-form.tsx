"use client";

import { useState, useTransition } from "react";
import { respondToCliAuthAction } from "@/app/[locale]/(app)/cli/authorize/actions";

export function CliAuthorizeForm({
  userCode,
  approveLabel,
  denyLabel,
  approvedMessage,
  deniedMessage,
}: {
  userCode: string;
  approveLabel: string;
  denyLabel: string;
  approvedMessage: string;
  deniedMessage: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<"approved" | "denied" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function respond(approve: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await respondToCliAuthAction(userCode, approve);
      if (!res.ok) return setError(res.error);
      setResult(approve ? "approved" : "denied");
    });
  }

  if (result) {
    return <p className="text-[14px] text-body">{result === "approved" ? approvedMessage : deniedMessage}</p>;
  }

  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => respond(true)}
          disabled={isPending}
          className="rounded-full bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {approveLabel}
        </button>
        <button
          type="button"
          onClick={() => respond(false)}
          disabled={isPending}
          className="rounded-full border border-hairline-strong px-5 py-2.5 text-[14px] font-medium text-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {denyLabel}
        </button>
      </div>
      {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
    </div>
  );
}
