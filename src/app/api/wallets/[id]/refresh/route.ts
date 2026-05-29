import { getAuthenticatedContext, getErrorMessage, jsonError, ok } from "@/app/api/_utils";
import { mapWallet } from "@/services/walletService";
import { enrichWallet } from "@/services/walletEnrichmentService";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const { id } = await params;

  try {
    const result = await enrichWallet(supabase, user.id, id);
    return ok({
      wallet: mapWallet(result.wallet),
      transactionCount: result.transactionCount,
      insertedTransactionCount: result.insertedTransactionCount,
      automationMatchCount: result.automationMatchCount,
      skipped: result.skipped,
      message: result.message,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
