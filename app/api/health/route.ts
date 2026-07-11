import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type ComponentStatus = "operational" | "degraded" | "down";

async function timed(check: () => Promise<void>): Promise<{ status: ComponentStatus; latencyMs: number }> {
  const start = Date.now();
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);
    const latencyMs = Date.now() - start;
    // ponytail: fixed 2s degraded threshold; make it an env var if it ever needs tuning
    return { status: latencyMs > 2000 ? "degraded" : "operational", latencyMs };
  } catch {
    return { status: "down", latencyMs: Date.now() - start };
  }
}

async function supabaseHealth(path: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}${path}`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
}

/**
 * Public health check for external status monitors (Atlassian Statuspage
 * component automation / third-party pings). Returns per-component status;
 * HTTP 200 when everything is operational, 503 otherwise, so a plain
 * HTTP-status monitor works without parsing the body.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimit(`${ip}:health`, 30, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const [database, auth, storage] = await Promise.all([
    timed(async () => {
      await prisma.$queryRaw`SELECT 1`;
    }),
    timed(() => supabaseHealth("/auth/v1/health")),
    timed(() => supabaseHealth("/storage/v1/version")),
  ]);

  const components = { database, auth, storage };
  const statuses = Object.values(components).map((c) => c.status);
  const overall: ComponentStatus = statuses.includes("down")
    ? "down"
    : statuses.includes("degraded")
      ? "degraded"
      : "operational";

  return NextResponse.json(
    {
      status: overall,
      components,
      timestamp: new Date().toISOString(),
    },
    { status: overall === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
