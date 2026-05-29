interface WalletRefreshLog {
  walletId: string;
  address: string;
  chain: string;
  status: "started" | "ready" | "skipped" | "failed";
  transferCount?: number;
  insertedCount?: number;
  reason?: string;
}

export function logWalletRefresh(event: WalletRefreshLog) {
  if (process.env.NODE_ENV === "production") return;

  const base = {
    walletId: event.walletId,
    address: event.address,
    chain: event.chain,
    status: event.status,
    transferCount: event.transferCount,
    insertedCount: event.insertedCount,
    reason: event.reason,
  };

  if (event.status === "failed") {
    console.warn("[wallet-refresh]", base);
    return;
  }

  console.info("[wallet-refresh]", base);
}
