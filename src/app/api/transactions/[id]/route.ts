import { getAuthenticatedContext, getErrorMessage, jsonError, ok } from "@/app/api/_utils";
import { getTransactionDetail } from "@/services/transactionService";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const { id } = await params;

  try {
    return ok(await getTransactionDetail(supabase, user.id, id));
  } catch (error) {
    return jsonError(getErrorMessage(error), 404);
  }
}
