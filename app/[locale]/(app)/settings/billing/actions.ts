"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { resolveActiveWorkspace } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { FREE_ENVIRONMENT_LIMIT } from "@/lib/billing";
import { getOrCreateCustomer, createCheckoutSession, createPortalSession } from "@/lib/stripe";

/**
 * Owner-only, mirrors the guard on app/[locale]/(app)/settings/page.tsx.
 * Prisma bypasses RLS, so this check (not a database policy) is the real
 * authorization boundary for both actions below.
 */
async function requireOwnerWorkspace() {
  const workspace = await resolveActiveWorkspace();
  if (!workspace || workspace.role !== "owner") {
    throw new Error("Tylko właściciel workspace'a może zarządzać płatnościami.");
  }
  return workspace;
}

export async function startCheckoutAction(locale: string) {
  const user = await requireUser();
  const workspace = await requireOwnerWorkspace();

  const row = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspace.id },
    select: { id: true, name: true, stripeCustomerId: true },
  });
  const customerId = await getOrCreateCustomer(row, user.email ?? "");

  const count = await prisma.envFile.count({ where: { workspaceId: workspace.id } });
  const quantity = Math.max(1, count - FREE_ENVIRONMENT_LIMIT); // at least 1 -- this is only reached when over the limit

  const url = await createCheckoutSession({ workspaceId: workspace.id, customerId, quantity, locale });
  redirect(url);
}

export async function openPortalAction(locale: string) {
  await requireUser();
  const workspace = await requireOwnerWorkspace();

  const row = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspace.id },
    select: { stripeCustomerId: true },
  });
  if (!row.stripeCustomerId) throw new Error("Brak klienta Stripe dla tego workspace'a.");

  const url = await createPortalSession(row.stripeCustomerId, locale);
  redirect(url);
}
