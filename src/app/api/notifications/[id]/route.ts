import { getAuthenticatedContext, getErrorMessage, jsonError, ok, readJson } from "@/app/api/_utils";
import { markNotificationRead } from "@/services/notificationService";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON body");

  const read = typeof body.read === "boolean" ? body.read : true;
  const { id } = await params;

  try {
    return ok(await markNotificationRead(supabase, user.id, id, read));
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
