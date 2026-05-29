"use client";

import { Brain, Clock, Copy, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { TransactionActivityRow } from "@/components/product/transaction-activity-row";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, shortenAddress } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { usePageSearch } from "@/hooks/use-page-search";
import { useState } from "react";

export default function TransactionsPage() {
  const pageSearch = usePageSearch();
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    selectedTransaction,
    detailLoading,
    detailError,
    selectTransaction,
    clearSelectedTransaction,
    summary,
  } = useTransactions();
  const {
    wallets,
    loading: walletsLoading,
    error: walletsError,
  } = useWallets();
  const selectedWallet = selectedTransaction
    ? wallets.find((wallet) => wallet.id === selectedTransaction.walletId)
    : undefined;
  const matchesSearch = (...values: Array<string | number | undefined | null>) =>
    !pageSearch || values.some((value) => String(value ?? "").toLowerCase().includes(pageSearch));
  const visibleTransactions = transactions.filter((transaction) => {
    const wallet = wallets.find((candidate) => candidate.id === transaction.walletId);
    return matchesSearch(
      transaction.asset,
      transaction.chain,
      transaction.hash,
      transaction.counterparty,
      transaction.explanation,
      transaction.type,
      transaction.status,
      wallet?.name,
      wallet?.address,
    );
  });

  return (
    <div>
      <PageHeader
        eyebrow="Transactions"
        title="Crypto activity with AI context"
        description="Transaction rows prioritize wallet, chain, value, status, counterparty, and the AI explanation operators need."
      />

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {[
          ["Confirmed", summary.confirmed],
          ["Pending", summary.pending],
          ["Flagged", summary.flagged],
          ["Total value", formatCurrency(summary.totalValue)],
        ].map(([label, value]) => (
          <div key={label} className="panel-surface rounded-lg p-4">
            <p className="text-xs text-white/38">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <Card className="bento-panel p-4">
        <div className="sticky-panel-header flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone="pink">All activity</Badge>
            <Badge tone="blue">AI explained</Badge>
            <Badge>Supabase API</Badge>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-white/44">
              {pageSearch ? `Filtered by "${pageSearch}".` : "Click a row to inspect the explanation drawer."}
            </p>
            <div className="flex rounded-full border border-white/10 bg-white/[0.035] p-1">
              {(["comfortable", "compact"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDensity(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    density === option ? "bg-white/12 text-white" : "text-white/46 hover:text-white/76"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
        {transactionsError ? <InlineError message={transactionsError} /> : null}
        {walletsError ? <InlineError message={walletsError} /> : null}
        <div className={`bounded-scroll soft-scrollbar [--scroll-max:42rem] ${density === "compact" ? "space-y-2" : "space-y-3"}`}>
          {transactionsLoading || walletsLoading ? (
            <TransactionSkeletons count={4} />
          ) : visibleTransactions.length ? (
            visibleTransactions.map((transaction) => (
              <TransactionActivityRow
                key={transaction.id}
                transaction={transaction}
                wallet={wallets.find((wallet) => wallet.id === transaction.walletId)}
                onClick={() => void selectTransaction(transaction)}
              />
            ))
          ) : (
            <div className="raised-row rounded-lg p-5 text-sm text-white/50">
              No transactions found yet. Refresh a monitored wallet to ingest recent Alchemy transfers.
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {selectedTransaction ? (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <button
              aria-label="Close transaction details"
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={clearSelectedTransaction}
            />
            <motion.aside
              className="panel-surface relative h-full w-full max-w-xl overflow-y-auto border-l border-white/10 p-5 sm:p-6"
              initial={{ x: 36, opacity: 0.88 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
            >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge tone={selectedTransaction.status === "flagged" ? "yellow" : "pink"}>
                  {selectedTransaction.status === "flagged" ? "Needs review" : "AI explanation"}
                </Badge>
                <h2 className="mt-4 text-2xl font-semibold capitalize">{selectedTransaction.type} details</h2>
                <div className="mt-2 flex items-center gap-2 text-sm text-white/46">
                  <span>{shortenAddress(selectedTransaction.hash)}</span>
                  <Copy className="h-3.5 w-3.5" />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearSelectedTransaction}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {detailError ? <InlineError message={detailError} /> : null}
            {detailLoading ? (
              <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/54">
                Refreshing backend transaction detail...
              </div>
            ) : null}

            <div className="glass-subtle mt-6 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/42">Value</p>
                  <p className="mt-1 text-3xl font-semibold">{formatCurrency(selectedTransaction.valueUsd)}</p>
                  <p className="mt-1 text-sm text-white/44">{selectedTransaction.amount} {selectedTransaction.asset}</p>
                </div>
                <StatusBadge status={selectedTransaction.status} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Detail label="Wallet" value={selectedWallet?.name ?? "Unknown"} />
                <Detail label="Chain" value={selectedTransaction.chain} />
                <Detail label="Counterparty" value={selectedTransaction.counterparty} />
                <Detail label="Time" value={selectedTransaction.time} />
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-fuchsia-200/14 bg-fuchsia-200/7 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-100">
                <Brain className="h-4 w-4" />
                Generated activity summary
              </div>
              <p className="mt-3 text-sm leading-7 text-white/66">{selectedTransaction.explanation}</p>
            </div>

            <div className="glass-subtle mt-5 rounded-lg p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                {selectedTransaction.status === "flagged" ? <ShieldAlert className="h-4 w-4 text-yellow-100" /> : <Clock className="h-4 w-4 text-emerald-200" />}
                Suggested operator action
              </div>
              <p className="mt-3 text-sm leading-7 text-white/54">
                {selectedTransaction.status === "flagged"
                  ? "Review spender contract history, confirm expected allowance, and pause related automation until approved."
                  : "No urgent intervention needed. Keep this event attached to the wallet timeline for audit context."}
              </p>
            </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-subtle rounded-lg p-4">
      <p className="text-xs font-semibold uppercase text-white/38">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function TransactionSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="raised-row rounded-lg p-4">
      <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr_0.8fr_auto]">
        <div className="h-10 rounded-lg bg-white/[0.05]" />
        <div className="h-10 rounded-lg bg-white/[0.045]" />
        <div className="h-10 rounded-lg bg-white/[0.045]" />
        <div className="h-10 w-20 rounded-lg bg-white/[0.045]" />
      </div>
      <div className="mt-4 h-10 rounded-lg bg-white/[0.035]" />
    </div>
  ));
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-red-300/18 bg-red-300/8 px-4 py-3 text-sm text-red-100">
      {message}
    </div>
  );
}
