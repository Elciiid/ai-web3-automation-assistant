import { enrichWallet } from "@/services/walletEnrichmentService";
import type { AppSupabaseClient, WalletRow } from "@/services/types";

type MonitorableWallet = Pick<
  WalletRow,
  "id" | "user_id" | "address" | "label" | "chain" | "created_at"
>;

type MonitoringWalletResult = {
  walletId: string;
  label: string;
  chain: string;
  status: "refreshed" | "skipped" | "failed";
  message: string;
  insertedTransactionCount: number;
  automationMatchCount: number;
};

export type ScheduledMonitoringResult = {
  enabled: boolean;
  startedAt: string;
  finishedAt: string;
  scannedWallets: number;
  refreshedWallets: number;
  skippedWallets: number;
  failedWallets: number;
  insertedTransactions: number;
  automationNotifications: number;
  results: MonitoringWalletResult[];
};

type ScheduledMonitoringOptions = {
  force?: boolean;
  forceTelegramDelivery?: boolean;
  userId?: string;
};

const supportedChains = new Set<WalletRow["chain"]>(["Ethereum", "Base", "Arbitrum", "Polygon"]);

export function isScheduledMonitoringEnabled() {
  return process.env.ENABLE_SCHEDULED_MONITORING === "true";
}

export async function runScheduledMonitoring(
  supabase?: AppSupabaseClient,
  options: ScheduledMonitoringOptions = {},
): Promise<ScheduledMonitoringResult> {
  const startedAt = new Date().toISOString();
  const enabled = options.force || isScheduledMonitoringEnabled();

  if (!enabled) {
    return createEmptyResult({
      startedAt,
      enabled: false,
      message: "Scheduled monitoring is disabled.",
    });
  }

  if (!supabase) {
    throw new Error("Supabase admin client is required when monitoring is enabled");
  }

  const wallets = await loadMonitoredWallets(supabase, options.userId);
  const results: MonitoringWalletResult[] = [];

  for (const wallet of wallets) {
    if (!supportedChains.has(wallet.chain)) {
      results.push({
        walletId: wallet.id,
        label: wallet.label,
        chain: wallet.chain,
        status: "skipped",
        message: `${wallet.chain} is not configured for scheduled enrichment.`,
        insertedTransactionCount: 0,
        automationMatchCount: 0,
      });
      continue;
    }

    try {
      console.info("[scheduled-monitoring] refreshing wallet", {
        walletId: wallet.id,
        label: wallet.label,
        chain: wallet.chain,
      });

      const enrichment = await enrichWallet(supabase, wallet.user_id, wallet.id, {
        forceTelegramDelivery: options.forceTelegramDelivery,
      });

      results.push({
        walletId: wallet.id,
        label: wallet.label,
        chain: wallet.chain,
        status: enrichment.skipped ? "skipped" : "refreshed",
        message: enrichment.message,
        insertedTransactionCount: enrichment.insertedTransactionCount,
        automationMatchCount: enrichment.automationMatchCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scheduled wallet refresh failed";
      console.warn("[scheduled-monitoring] wallet failed", {
        walletId: wallet.id,
        label: wallet.label,
        chain: wallet.chain,
        message,
      });

      results.push({
        walletId: wallet.id,
        label: wallet.label,
        chain: wallet.chain,
        status: "failed",
        message,
        insertedTransactionCount: 0,
        automationMatchCount: 0,
      });
    }
  }

  return summarizeRun({
    enabled: true,
    startedAt,
    scannedWallets: wallets.length,
    results,
  });
}

async function loadMonitoredWallets(supabase: AppSupabaseClient, userId?: string) {
  let query = supabase
    .from("wallets")
    .select("id, user_id, address, label, chain, created_at")
    .order("created_at", { ascending: true });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as MonitorableWallet[];
}

function summarizeRun(input: {
  enabled: boolean;
  startedAt: string;
  scannedWallets: number;
  results: MonitoringWalletResult[];
}): ScheduledMonitoringResult {
  return {
    enabled: input.enabled,
    startedAt: input.startedAt,
    finishedAt: new Date().toISOString(),
    scannedWallets: input.scannedWallets,
    refreshedWallets: input.results.filter((result) => result.status === "refreshed").length,
    skippedWallets: input.results.filter((result) => result.status === "skipped").length,
    failedWallets: input.results.filter((result) => result.status === "failed").length,
    insertedTransactions: input.results.reduce((sum, result) => sum + result.insertedTransactionCount, 0),
    automationNotifications: input.results.reduce((sum, result) => sum + result.automationMatchCount, 0),
    results: input.results,
  };
}

function createEmptyResult(input: {
  enabled: boolean;
  startedAt: string;
  message: string;
}): ScheduledMonitoringResult {
  return {
    enabled: input.enabled,
    startedAt: input.startedAt,
    finishedAt: new Date().toISOString(),
    scannedWallets: 0,
    refreshedWallets: 0,
    skippedWallets: 0,
    failedWallets: 0,
    insertedTransactions: 0,
    automationNotifications: 0,
    results: [
      {
        walletId: "monitoring",
        label: "Scheduled monitoring",
        chain: "system",
        status: "skipped",
        message: input.message,
        insertedTransactionCount: 0,
        automationMatchCount: 0,
      },
    ],
  };
}
