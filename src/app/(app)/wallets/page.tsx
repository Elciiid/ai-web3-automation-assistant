"use client";

import { FormEvent, useState } from "react";
import { Brain, Clock3, Loader2, Plus, ShieldCheck } from "lucide-react";
import { TransactionActivityRow } from "@/components/product/transaction-activity-row";
import { WalletAccountCard } from "@/components/product/wallet-account-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { aiInsights } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { usePageSearch } from "@/hooks/use-page-search";
import type { Chain, Wallet } from "@/types";

const chains = ["Ethereum", "Base", "Arbitrum", "Polygon"] as const satisfies readonly Chain[];

export default function WalletsPage() {
  const pageSearch = usePageSearch();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning" | "error"; message: string } | null>(null);
  const {
    wallets,
    loading: walletsLoading,
    error: walletsError,
    totalBalance,
    chainCount,
    createWallet,
    deleteWallet,
    refreshWallet,
    saving,
    pendingDeleteIds,
    refreshingIds,
  } = useWallets();
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    reload: reloadTransactions,
  } = useTransactions();
  const highRiskCount = wallets.filter((wallet) => wallet.risk === "high" || wallet.risk === "medium").length;
  const matchesSearch = (...values: Array<string | number | undefined | null>) =>
    !pageSearch || values.some((value) => String(value ?? "").toLowerCase().includes(pageSearch));
  const visibleWallets = wallets.filter((wallet) =>
    matchesSearch(wallet.name, wallet.address, wallet.chain, wallet.risk, wallet.tags.join(" ")),
  );
  const visibleTransactions = transactions.filter((transaction) =>
    matchesSearch(transaction.asset, transaction.chain, transaction.hash, transaction.counterparty, transaction.explanation, transaction.type),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Wallet monitoring"
        title="Web3 account monitoring"
        description="Account cards show balance, risk, chain, tags, and recency with AI insights attached to the wallet timeline."
      />

      <div className="page-stack">
        <Card className="p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm text-white/44">Total monitored value</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <p className="text-4xl font-semibold">{formatCurrency(totalBalance)}</p>
                <Badge tone="green">{walletsLoading ? "Loading" : `${wallets.length} wallets`}</Badge>
                <Badge tone="blue">{walletsLoading ? "Syncing" : `${chainCount} chains`}</Badge>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/46">
                {pageSearch
                  ? `Workspace filtered by "${pageSearch}".`
                  : "Wallet records are real backend rows; balances and activity update after enrichment runs."}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)} className="w-fit">
              <Plus className="h-4 w-4" />
              Add wallet
            </Button>
          </div>
          {feedback ? (
            <div className={feedback.tone === "error"
              ? "mt-4 rounded-lg border border-red-300/18 bg-red-300/8 px-4 py-3 text-sm text-red-100"
              : feedback.tone === "warning"
                ? "mt-4 rounded-lg border border-yellow-300/18 bg-yellow-300/8 px-4 py-3 text-sm text-yellow-100"
                : "mt-4 rounded-lg border border-emerald-300/18 bg-emerald-300/8 px-4 py-3 text-sm text-emerald-100"}
            >
              {feedback.message}
            </div>
          ) : null}
        </Card>

        <section className="bento-grid items-stretch xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Card className="bento-panel flex h-full min-h-0 flex-col p-4">
            <div className="sticky-panel-header flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">Monitored wallets</h2>
                <p className="mt-1 text-sm text-white/44">Cards stay inside this panel so the page rhythm remains bounded.</p>
              </div>
              <Badge tone="green">{visibleWallets.length} shown</Badge>
            </div>
            <div className="bounded-scroll soft-scrollbar grid gap-4 md:grid-cols-2 2xl:grid-cols-3 [--scroll-max:42rem] flex-1">
            {walletsError ? <InlineError message={walletsError} /> : null}
            {walletsLoading ? (
              <WalletSkeletons count={3} />
            ) : visibleWallets.length ? (
              visibleWallets.map((wallet) => (
                <WalletAccountCard
                  key={wallet.id}
                  wallet={wallet}
                  deleting={pendingDeleteIds.includes(wallet.id)}
                  refreshing={refreshingIds.includes(wallet.id)}
                  onRefresh={async () => {
                    try {
                      const result = await refreshWallet(wallet.id);
                      await reloadTransactions();
                      setFeedback({
                        tone: result.skipped ? "warning" : "success",
                        message: `${wallet.name}: ${result.message}`,
                      });
                    } catch (refreshError) {
                      setFeedback({
                        tone: "error",
                        message: refreshError instanceof Error ? refreshError.message : "Wallet refresh failed.",
                      });
                    }
                  }}
                  onDelete={() => setDeleteTarget(wallet)}
                />
              ))
            ) : (
              <div className="raised-row rounded-lg p-5 text-sm text-white/50 md:col-span-2 xl:col-span-3">
                No backend wallets found. New Supabase users receive demo wallets after sign-up seeding.
              </div>
            )}
            </div>
          </Card>

          <div className="bento-stack flex h-full flex-col gap-4">
            <Card className="bento-panel flex flex-1 flex-col">
              <CardHeader className="px-5">
                <div>
                  <CardTitle>AI wallet insights</CardTitle>
                  <p className="mt-1 text-sm text-white/46">Contextual analyst notes for monitored accounts.</p>
                </div>
                <Brain className="h-5 w-5 text-fuchsia-100" />
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-5 min-h-0">
                <div className="bounded-scroll soft-scrollbar grid gap-3 [--scroll-max:28rem] flex-1">
                  {aiInsights.map((insight) => (
                    <div key={insight.id} className="raised-row w-full rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">{insight.title}</p>
                        <Badge tone={insight.tone === "watch" ? "yellow" : "green"}>{insight.confidence}%</Badge>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-white/50">{insight.summary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bento-panel p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-200" />
                </div>
                <div>
                  <h2 className="font-semibold">Risk posture</h2>
                  <p className="text-sm text-white/44">
                    {walletsLoading ? "Loading account posture" : `${highRiskCount} wallet${highRiskCount === 1 ? "" : "s"} need attention`}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {["Approval review enabled", "High-value transfers watched", "Known counterparties mapped"].map((item) => (
                  <div key={item} className="raised-row rounded-lg p-3 text-sm text-white/66">{item}</div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <Card className="bento-panel">
          <CardHeader>
            <div>
              <CardTitle>Wallet activity timeline</CardTitle>
              <p className="mt-1 text-sm text-white/46">Rows are optimized for quick crypto activity review.</p>
            </div>
            <Clock3 className="h-5 w-5 text-fuchsia-100" />
          </CardHeader>
          <CardContent>
            <div className="bounded-scroll soft-scrollbar space-y-3 [--scroll-max:34rem]">
              {transactionsError ? <InlineError message={transactionsError} /> : null}
              {transactionsLoading ? (
                <TransactionSkeletons count={4} />
              ) : visibleTransactions.length ? (
                visibleTransactions.map((transaction) => (
                  <TransactionActivityRow
                    key={transaction.id}
                    transaction={transaction}
                    wallet={wallets.find((wallet) => wallet.id === transaction.walletId)}
                  />
                ))
              ) : (
                <div className="raised-row rounded-lg p-5 text-sm text-white/50">
                  No recent transfers found yet. Refresh a wallet to ask Alchemy for recent blockchain activity.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <AddWalletDialog
        open={addOpen}
        saving={saving}
        onOpenChange={setAddOpen}
        onCreate={async (draft) => {
          const created = await createWallet(draft);
          await reloadTransactions();
          setFeedback({ tone: "success", message: `${created.name} is now monitored. Refresh is available from the wallet card.` });
          setAddOpen(false);
        }}
      />
      <DeleteWalletDialog
        wallet={deleteTarget}
        deleting={deleteTarget ? pendingDeleteIds.includes(deleteTarget.id) : false}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDelete={async () => {
          if (!deleteTarget) return;
          const walletName = deleteTarget.name;
          await deleteWallet(deleteTarget.id);
          await reloadTransactions();
          setFeedback({ tone: "success", message: `${walletName} was removed from monitored wallets.` });
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function AddWalletDialog({
  open,
  saving,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (draft: { label?: string; address: string; chain: Chain }) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("label") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const chain = String(formData.get("chain") ?? "");

    if (!address) {
      setError("Wallet address is required.");
      return;
    }

    const supportedChain = chains.find((candidate) => candidate === chain);
    if (!supportedChain) {
      setError("Choose a supported chain.");
      return;
    }

    try {
      await onCreate({ label, address, chain: supportedChain });
      event.currentTarget.reset();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to add wallet.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add monitored wallet</DialogTitle>
          <DialogDescription>
            Add a wallet record to the Supabase-backed monitoring list. If Alchemy is configured, the app will enrich balances and recent transfers after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Input name="label" placeholder="Wallet label, e.g. Treasury Multisig" />
          <Input name="address" placeholder="Wallet address, e.g. 0x..." required />
          <select
            name="chain"
            defaultValue="Ethereum"
            className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none backdrop-blur-xl transition hover:border-white/16 hover:bg-white/[0.06] focus:border-fuchsia-200/50 focus:bg-white/[0.072] focus:ring-4 focus:ring-fuchsia-300/10"
            required
          >
            {chains.map((chain) => (
              <option key={chain} value={chain} className="bg-[#18181b] text-white">
                {chain}
              </option>
            ))}
          </select>
          {error ? <InlineError message={error} /> : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add wallet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteWalletDialog({
  wallet,
  deleting,
  onOpenChange,
  onDelete,
}: {
  wallet: Wallet | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setError(null);
    try {
      await onDelete();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete wallet.");
    }
  }

  return (
    <Dialog open={Boolean(wallet)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove monitored wallet?</DialogTitle>
          <DialogDescription>
            This removes {wallet?.name ?? "this wallet"} from the monitored wallet list. It does not disconnect a real wallet or affect on-chain funds.
          </DialogDescription>
        </DialogHeader>
        {error ? <InlineError message={error} /> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Delete wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WalletSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="panel-surface rounded-lg p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-white/[0.06]" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-32 rounded-full bg-white/[0.07]" />
          <div className="mt-2 h-3 w-24 rounded-full bg-white/[0.05]" />
        </div>
      </div>
      <div className="mt-6 h-8 w-36 rounded-full bg-white/[0.07]" />
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-white/[0.05]" />
        <div className="h-6 w-20 rounded-full bg-white/[0.05]" />
      </div>
    </div>
  ));
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
    <div className="rounded-lg border border-red-300/18 bg-red-300/8 px-4 py-3 text-sm text-red-100 md:col-span-2 xl:col-span-3">
      {message}
    </div>
  );
}
