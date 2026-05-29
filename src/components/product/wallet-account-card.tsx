import { ArrowDownRight, ArrowUpRight, Copy, Loader2, RefreshCw, Trash2, Wallet2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, shortenAddress } from "@/lib/utils";
import type { Wallet } from "@/types";

export function WalletAccountCard({
  wallet,
  featured = false,
  onDelete,
  onRefresh,
  deleting = false,
  refreshing = false,
}: {
  wallet: Wallet;
  featured?: boolean;
  onDelete?: () => void;
  onRefresh?: () => void;
  deleting?: boolean;
  refreshing?: boolean;
}) {
  const PositiveIcon = wallet.change24h >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={featured ? "overflow-hidden" : "p-5"}>
      <div className={featured ? "p-5" : ""}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-xl">
              <Wallet2 className="h-5 w-5 text-fuchsia-100" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{wallet.name}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-white/42">
                <span>{shortenAddress(wallet.address)}</span>
                <Copy className="h-3 w-3" />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={wallet.risk} />
            {onRefresh ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/46"
                onClick={onRefresh}
                disabled={refreshing || deleting}
                aria-label={`Refresh ${wallet.name}`}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/46 hover:text-red-100"
                onClick={onDelete}
                disabled={deleting}
                aria-label={`Delete ${wallet.name}`}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/42">Balance</p>
            <p className="mt-1 text-3xl font-semibold text-white">{formatCurrency(wallet.balanceUsd)}</p>
          </div>
          <div className={wallet.change24h >= 0 ? "text-right text-emerald-200" : "text-right text-red-200"}>
            <PositiveIcon className="ml-auto h-4 w-4" />
            <p className="mt-1 text-sm font-semibold">{wallet.change24h >= 0 ? "+" : ""}{wallet.change24h}%</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="blue">{wallet.chain}</Badge>
          {wallet.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          <span className="text-xs text-white/38">{wallet.lastSeen}</span>
        </div>
      </div>
      {featured ? (
        <div className="grid grid-cols-3 gap-px bg-white/10 text-center text-xs">
          {["Net flow", "Rules", "Risk"].map((item, index) => (
            <div key={item} className="bg-white/[0.035] p-3 backdrop-blur-xl">
              <p className="text-white/38">{item}</p>
              <p className="mt-1 font-semibold text-white">{index === 0 ? "+$92k" : index === 1 ? "8" : wallet.risk}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
