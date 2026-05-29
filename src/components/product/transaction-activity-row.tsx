"use client";

import { ArrowRight, Brain, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, shortenAddress } from "@/lib/utils";
import type { Transaction, Wallet } from "@/types";

export function TransactionActivityRow({
  transaction,
  wallet,
  onClick,
}: {
  transaction: Transaction;
  wallet?: Wallet;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone="blue">{transaction.chain}</Badge>
          <span className="text-sm font-semibold capitalize text-white">{transaction.type}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/36" />
        </div>
        <p className="mt-2 truncate text-xs text-white/40">{shortenAddress(transaction.hash)}</p>
        <div className="mt-3 min-w-0">
          <p className="truncate text-sm font-semibold text-white">{wallet?.name ?? "Unknown wallet"}</p>
          <p className="mt-1 truncate text-xs text-white/40">{transaction.counterparty}</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{formatCurrency(transaction.valueUsd)}</p>
        <p className="mt-1 text-xs text-white/40">{transaction.amount} {transaction.asset}</p>
        <div className="mt-4 flex items-center justify-between gap-3 sm:justify-start xl:justify-end">
          <StatusBadge status={transaction.status} />
          <ArrowRight className="h-4 w-4 shrink-0 text-white/32 transition" />
        </div>
      </div>
      <div className="flex items-start gap-2 border-t border-white/10 pt-3 sm:col-span-2">
        <Brain className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-100" />
        <p className="line-clamp-2 text-xs leading-5 text-white/50">{transaction.explanation}</p>
      </div>
    </>
  );

  if (!onClick) {
    return (
      <div className="raised-row grid w-full gap-4 rounded-lg p-4 text-left sm:grid-cols-[minmax(0,1fr)_max-content]">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="raised-row interactive-row grid w-full gap-4 rounded-lg p-4 text-left sm:grid-cols-[minmax(0,1fr)_max-content]"
    >
      {content}
    </button>
  );
}
