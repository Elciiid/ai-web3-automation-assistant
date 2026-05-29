import type { Chain, Wallet } from "@/types";
import { formatRelativeTime, parseNumber } from "@/services/format";
import { isDisplaySafeToken } from "@/services/blockchain/safety";
import type { AppSupabaseClient, WalletRow } from "@/services/types";

export interface CreateWalletInput {
  address: string;
  label: string;
  chain: Chain;
}

export async function getWallets(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapWallet);
}

export async function createWallet(supabase: AppSupabaseClient, userId: string, input: CreateWalletInput) {
  const { data, error } = await supabase
    .from("wallets")
    .insert({
      user_id: userId,
      address: input.address,
      label: input.label,
      chain: input.chain,
    })
    .select()
    .single();

  if (error) throw error;
  return mapWallet(data);
}

export async function getWallet(supabase: AppSupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return mapWallet(data);
}

export async function deleteWallet(supabase: AppSupabaseClient, userId: string, id: string) {
  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export function mapWallet(row: WalletRow): Wallet {
  const tokenSymbols = Array.isArray(row.token_summary_json)
    ? row.token_summary_json
        .map((token) => token && typeof token === "object" && "symbol" in token ? String(token.symbol) : null)
        .filter((token): token is string => isDisplaySafeToken(token))
        .slice(0, 2)
    : [];

  return {
    id: row.id,
    name: row.label,
    address: row.address,
    chain: row.chain,
    balanceUsd: parseNumber(row.balance_usd),
    change24h: 0,
    risk: row.enrichment_status === "failed" ? "medium" : "low",
    lastSeen: row.enriched_at ? formatRelativeTime(row.enriched_at) : "Not enriched",
    tags: [row.native_symbol, row.enrichment_status, ...tokenSymbols],
  };
}
