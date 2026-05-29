import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedContext, getErrorMessage, jsonError, ok } from "@/app/api/_utils";
import { runScheduledMonitoring } from "@/services/scheduledMonitoringService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const { user } = await getAuthenticatedContext();

  if (!user) {
    return jsonError("Authentication required", 401);
  }

  try {
    const result = await runScheduledMonitoring(createAdminClient(), {
      force: true,
      userId: user.id,
    });

    return ok({
      ...result,
      mode: "manual-demo",
      telegramEnabled: process.env.ENABLE_TELEGRAM_NOTIFICATIONS === "true",
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.warn("[demo-monitoring] run failed", { userId: user.id, message });
    return jsonError(message, 500);
  }
}
