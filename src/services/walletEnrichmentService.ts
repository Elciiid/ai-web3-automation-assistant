import { fetchAlchemyWalletSnapshot } from "@/services/blockchain/alchemyProvider";
import { logWalletRefresh } from "@/services/blockchain/enrichmentLogger";
import { evaluateAutomationRulesForTransactions } from "@/services/automationExecutionService";
import { summarizeTransactions } from "@/services/aiTransactionSummaryService";
import type { WalletEnrichmentSnapshot } from "@/services/blockchain/types";
import type { AppSupabaseClient, TransactionRow, WalletRow } from "@/services/types";
import type { Json } from "@/lib/supabase/database.types";

type WalletWithUser = Pick<WalletRow, "id" | "user_id" | "address" | "label" | "chain">;

export interface WalletEnrichmentResult {
  wallet: WalletRow;
  transactionCount: number;
  insertedTransactionCount: number;
  automationMatchCount: number;
  skipped: boolean;
  message: string;
}

export async function enrichWallet(
  supabase: AppSupabaseClient,
  userId: string,
  walletId: string,
): Promise<WalletEnrichmentResult> {
  const wallet = await getOwnedWallet(supabase, userId, walletId);
  logWalletRefresh({
    walletId,
    address: wallet.address,
    chain: wallet.chain,
    status: "started",
  });

  if (!process.env.ALCHEMY_API_KEY) {
    const reason = "ALCHEMY_API_KEY is not configured";
    logWalletRefresh({
      walletId,
      address: wallet.address,
      chain: wallet.chain,
      status: "skipped",
      reason,
    });

    return {
      wallet: await markWalletSkipped(supabase, walletId, reason),
      transactionCount: 0,
      insertedTransactionCount: 0,
      automationMatchCount: 0,
      skipped: true,
      message: "Wallet enrichment skipped because Alchemy is not configured.",
    };
  }

  try {
    const snapshot = await fetchAlchemyWalletSnapshot(wallet.address, wallet.chain);
    const updatedWallet = await storeWalletSnapshot(supabase, walletId, snapshot);
    const insertedTransactions = await storeWalletTransactions(supabase, walletId, snapshot);
    const summarizedTransactions = await summarizeAndStoreTransactions(supabase, wallet, insertedTransactions);
    const insertedTransactionCount = insertedTransactions.length;
    const automationMatchCount = await evaluateAutomationRulesForTransactions(supabase, {
      userId,
      wallet,
      transactions: summarizedTransactions,
    });
    const transferCount = snapshot.transfers.length;
    logWalletRefresh({
      walletId,
      address: wallet.address,
      chain: wallet.chain,
      status: "ready",
      transferCount,
      insertedCount: insertedTransactionCount,
    });

    return {
      wallet: updatedWallet,
      transactionCount: transferCount,
      insertedTransactionCount,
      automationMatchCount,
      skipped: false,
      message: createSuccessMessage(transferCount, insertedTransactionCount, automationMatchCount),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet enrichment failed";
    await markWalletFailed(supabase, walletId, message);
    logWalletRefresh({
      walletId,
      address: wallet.address,
      chain: wallet.chain,
      status: "failed",
      reason: message,
    });
    throw new Error(message);
  }
}

async function getOwnedWallet(supabase: AppSupabaseClient, userId: string, walletId: string) {
  const { data, error } = await supabase
    .from("wallets")
    .select("id, user_id, address, label, chain")
    .eq("id", walletId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as WalletWithUser;
}

async function storeWalletSnapshot(
  supabase: AppSupabaseClient,
  walletId: string,
  snapshot: WalletEnrichmentSnapshot,
) {
  const { data, error } = await supabase
    .from("wallets")
    .update({
      native_balance: snapshot.nativeBalance,
      native_symbol: snapshot.nativeSymbol,
      balance_usd: snapshot.balanceUsd,
      token_summary_json: snapshot.tokens as unknown as Json,
      enriched_at: new Date().toISOString(),
      enrichment_status: "ready",
      enrichment_error: null,
    })
    .eq("id", walletId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function storeWalletTransactions(
  supabase: AppSupabaseClient,
  walletId: string,
  snapshot: WalletEnrichmentSnapshot,
) {
  const transactions = snapshot.transfers.map((transfer) => ({
    wallet_id: walletId,
    hash: transfer.hash,
    type: transfer.type,
    token: transfer.token,
    amount: transfer.amount,
    from_address: transfer.fromAddress,
    to_address: transfer.toAddress,
    timestamp: transfer.timestamp,
    ai_summary: null,
  }));

  if (!transactions.length) return [];

  const hashes = transactions.map((transaction) => transaction.hash);
  const { data: existingRows, error: existingError } = await supabase
    .from("transactions")
    .select("hash")
    .eq("wallet_id", walletId)
    .in("hash", hashes);

  if (existingError) throw existingError;

  const existingHashes = new Set((existingRows ?? []).map((row) => row.hash));
  const missingTransactions = transactions.filter((transaction) => !existingHashes.has(transaction.hash));

  if (!missingTransactions.length) return [];

  const { data, error } = await supabase
    .from("transactions")
    .insert(missingTransactions)
    .select("*");

  if (error) {
    if (error.code === "23505") return [];
    throw error;
  }

  return (data ?? []) as TransactionRow[];
}

async function summarizeAndStoreTransactions(
  supabase: AppSupabaseClient,
  wallet: WalletWithUser,
  transactions: TransactionRow[],
) {
  if (!transactions.length) return [];

  const summaries = await summarizeTransactions({ wallet, transactions });
  const summaryByHash = new Map(summaries.map((summary) => [summary.hash, summary.summary]));
  const updatedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      const summary = summaryByHash.get(transaction.hash);
      if (!summary) return transaction;

      const { data, error } = await supabase
        .from("transactions")
        .update({ ai_summary: summary })
        .eq("id", transaction.id)
        .is("ai_summary", null)
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return (data ?? { ...transaction, ai_summary: summary }) as TransactionRow;
    }),
  );

  return updatedTransactions;
}

async function markWalletSkipped(supabase: AppSupabaseClient, walletId: string, reason: string) {
  const { data, error } = await supabase
    .from("wallets")
    .update({
      enrichment_status: "skipped",
      enrichment_error: reason,
      enriched_at: new Date().toISOString(),
    })
    .eq("id", walletId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function markWalletFailed(supabase: AppSupabaseClient, walletId: string, reason: string) {
  const { error } = await supabase
    .from("wallets")
    .update({
      enrichment_status: "failed",
      enrichment_error: reason,
      enriched_at: new Date().toISOString(),
    })
    .eq("id", walletId);

  if (error) throw error;
}

function createSuccessMessage(
  transferCount: number,
  insertedTransactionCount: number,
  automationMatchCount: number,
) {
  if (transferCount === 0) {
    return "Refresh completed. Alchemy returned no recent transfers for this wallet.";
  }

  if (insertedTransactionCount === 0) {
    return `Refresh completed. ${transferCount} recent transfer${transferCount === 1 ? "" : "s"} already existed in this wallet timeline.`;
  }

  const notificationText = automationMatchCount
    ? ` Created ${automationMatchCount} automation notification${automationMatchCount === 1 ? "" : "s"}.`
    : " No automation rules matched.";

  return `Refresh completed. Added ${insertedTransactionCount} new transaction${insertedTransactionCount === 1 ? "" : "s"} from ${transferCount} recent transfer${transferCount === 1 ? "" : "s"}.${notificationText}`;
}
