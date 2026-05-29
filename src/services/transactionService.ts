import type { Transaction } from "@/types";
import { formatRelativeTime, parseNumber } from "@/services/format";
import { isSuspiciousTokenLabel } from "@/services/blockchain/safety";
import type { AppSupabaseClient, TransactionRow } from "@/services/types";

type TransactionWithWallet = TransactionRow & {
  wallets?: {
    user_id: string;
    label: string;
    chain: Transaction["chain"];
  };
};

export async function getTransactions(supabase: AppSupabaseClient, userId: string, walletId?: string) {
  let query = supabase
    .from("transactions")
    .select("*, wallets!inner(user_id, label, chain)")
    .eq("wallets.user_id", userId)
    .order("timestamp", { ascending: false });

  if (walletId) {
    query = query.eq("wallet_id", walletId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as TransactionWithWallet[])
    .filter((row) => !isSuspiciousTokenLabel(row.token))
    .map(mapTransaction);
}

export async function getTransactionDetail(supabase: AppSupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, wallets!inner(user_id, label, chain)")
    .eq("id", id)
    .eq("wallets.user_id", userId)
    .single();

  if (error) throw error;
  return mapTransaction(data as TransactionWithWallet);
}

function mapTransaction(row: TransactionWithWallet): Transaction {
  return {
    id: row.id,
    hash: row.hash,
    walletId: row.wallet_id,
    type: row.type,
    asset: row.token,
    amount: parseNumber(row.amount),
    valueUsd: estimateValue(row),
    counterparty: row.to_address,
    chain: row.wallets?.chain ?? "Ethereum",
    status: row.type === "approval" ? "flagged" : row.type === "bridge" ? "pending" : "confirmed",
    time: formatRelativeTime(row.timestamp),
    explanation: row.ai_summary ?? "AI summary pending for this transaction.",
  };
}

function estimateValue(row: TransactionWithWallet) {
  const amount = parseNumber(row.amount);
  if (row.token === "ETH" || row.token === "WETH") return amount * 3400;
  return amount;
}
