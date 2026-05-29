import { deleteWallet } from "@/services/walletService";
import { getAuthenticatedContext, getErrorMessage, jsonError, ok } from "@/app/api/_utils";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const { id } = await params;

  try {
    await deleteWallet(supabase, user.id, id);
    return ok({ id });
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
