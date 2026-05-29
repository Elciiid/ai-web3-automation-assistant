import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isScheduledMonitoringEnabled, runScheduledMonitoring } from "@/services/scheduledMonitoringService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized scheduled monitoring request" }, { status: 401 });
  }

  try {
    const result = await runScheduledMonitoring(
      isScheduledMonitoringEnabled() ? createAdminClient() : undefined,
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduled monitoring failed";
    console.warn("[scheduled-monitoring] run failed", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== "production") return true;
  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}
