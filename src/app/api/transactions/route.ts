import { getAuthenticatedContext, getErrorMessage, jsonError, ok } from "@/app/api/_utils";
import { getTransactions } from "@/services/transactionService";

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get("walletId") ?? undefined;

  try {
    return ok(await getTransactions(supabase, user.id, walletId));
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
