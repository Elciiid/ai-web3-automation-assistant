import { getAuthenticatedContext, getErrorMessage, jsonError, ok } from "@/app/api/_utils";
import { getNotifications } from "@/services/notificationService";

export async function GET() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  try {
    return ok(await getNotifications(supabase, user.id));
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
