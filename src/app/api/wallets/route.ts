import { getAuthenticatedContext, getErrorMessage, isAllowed, jsonError, ok, readJson, requiredString } from "@/app/api/_utils";
import { createWallet, getWallet, getWallets, mapWallet } from "@/services/walletService";
import { enrichWallet } from "@/services/walletEnrichmentService";
import type { Chain } from "@/types";

const chains = ["Ethereum", "Base", "Arbitrum", "Polygon"] as const satisfies readonly Chain[];

export async function GET() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  try {
    return ok(await getWallets(supabase, user.id));
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON body");

  const address = requiredString(body, "address");
  const label = requiredString(body, "label") ?? requiredString(body, "name");
  const chain = requiredString(body, "chain");

  if (!address || !label || !isAllowed(chain, chains)) {
    return jsonError("address, label, and valid chain are required");
  }

  try {
    const wallet = await createWallet(supabase, user.id, { address, label, chain });

    try {
      const enrichment = await enrichWallet(supabase, user.id, wallet.id);
      return ok(mapWallet(enrichment.wallet), { status: 201 });
    } catch {
      return ok(await getWallet(supabase, user.id, wallet.id), { status: 201 });
    }
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
