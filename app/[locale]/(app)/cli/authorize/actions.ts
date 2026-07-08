"use server";

import { requireUser } from "@/lib/auth";
import { resolveDeviceAuth } from "@/lib/cli-auth";

export type CliAuthorizeResult = { ok: true } | { ok: false; error: string };

export async function respondToCliAuthAction(userCode: string, approve: boolean): Promise<CliAuthorizeResult> {
  const user = await requireUser();
  return resolveDeviceAuth(userCode, user.id, approve);
}
