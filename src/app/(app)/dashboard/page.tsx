"use client";

import { Bell, Bot, CircleDollarSign, ShieldCheck, Zap } from "lucide-react";
import { AiCommandCenter } from "@/components/product/ai-command-center";
import { AutomationRuleCard } from "@/components/product/automation-rule-card";
import { DemoReadinessPanel } from "@/components/product/demo-readiness-panel";
import { TransactionActivityRow } from "@/components/product/transaction-activity-row";
import { WalletAccountCard } from "@/components/product/wallet-account-card";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationWalletContext } from "@/components/product/notification-wallet-context";
import { useAutomations } from "@/hooks/use-automations";
import { useNotifications } from "@/hooks/use-notifications";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { usePageSearch } from "@/hooks/use-page-search";
import { formatCurrency } from "@/lib/utils";
import type { DashboardMetric } from "@/types";

export default function DashboardPage() {
  const pageSearch = usePageSearch();
  const {
    rules,
    loading: automationsLoading,
    error: automationsError,
    createRule,
    toggleRule,
  } = useAutomations();
  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications();
  const {
    wallets,
    loading: walletsLoading,
    error: walletsError,
    totalBalance,
  } = useWallets();
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    summary: transactionSummary,
  } = useTransactions();

  const metrics: DashboardMetric[] = [
    {
      label: "Monitored value",
      value: formatCurrency(totalBalance),
      delta: walletsLoading ? "Loading wallets" : `${wallets.length} backend wallets`,
      tone: "positive",
      icon: CircleDollarSign,
    },
    {
      label: "Active automations",
      value: String(rules.filter((rule) => rule.status === "active").length),
      delta: automationsLoading ? "Loading rules" : `${rules.length} saved rules`,
      tone: "neutral",
      icon: Zap,
    },
    {
      label: "AI explanations",
      value: String(transactions.length),
      delta: transactionsLoading ? "Loading activity" : "Seeded backend summaries",
      tone: "positive",
      icon: Bot,
    },
    {
      label: "Risk events",
      value: String(transactionSummary.flagged),
      delta: transactionSummary.flagged ? "Needs review" : "No flagged activity",
      tone: "warning",
      icon: ShieldCheck,
    },
  ];
  const matchesSearch = (...values: Array<string | number | undefined | null>) =>
    !pageSearch || values.some((value) => String(value ?? "").toLowerCase().includes(pageSearch));
  const visibleRules = rules.filter((rule) =>
    matchesSearch(rule.name, rule.description, rule.prompt, rule.walletScope, rule.condition.value, rule.status),
  );
  const visibleTransactions = transactions.filter((transaction) =>
    matchesSearch(transaction.asset, transaction.chain, transaction.hash, transaction.counterparty, transaction.explanation, transaction.type),
  );
  const visibleNotifications = notifications.filter((notification) =>
    matchesSearch(notification.title, notification.description, notification.source, notification.walletIdentity),
  );
  const visibleWallets = wallets.filter((wallet) =>
    matchesSearch(wallet.name, wallet.address, wallet.chain, wallet.risk, wallet.tags.join(" ")),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Command center"
        title="AI Web3 automation workspace"
        description="The primary flow is simple: describe what to watch, let AI structure the rule, save it, and manage the active automation below."
      />

      <DemoReadinessPanel />

      <div className="mt-6">
        <AiCommandCenter hero onSaveAutomation={createRule} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <section className="bento-grid mt-6 xl:grid-cols-[1fr_0.92fr]">
        <Card className="bento-panel flex min-h-0 flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Active automations</h2>
              <p className="mt-1 text-sm panel-muted">
                {pageSearch ? `Filtered by "${pageSearch}".` : "Saved rules from the AI command center appear here immediately."}
              </p>
            </div>
            <Badge tone="green">{rules.filter((rule) => rule.status === "active").length} active</Badge>
          </div>
          {automationsError ? <InlineError message={automationsError} /> : null}
          <div className="bounded-scroll soft-scrollbar grid gap-4 [--scroll-max:42rem]">
            {automationsLoading ? (
              <RuleSkeletons count={3} />
            ) : rules.length ? (
              visibleRules.slice(0, 3).map((rule) => (
                <AutomationRuleCard
                  key={rule.id}
                  rule={rule}
                  compact
                  onToggle={() => toggleRule(rule.id)}
                />
              ))
            ) : (
              <div className="raised-row rounded-lg p-5 text-sm text-white/50">
                No backend automations yet. Save a rule from the command center to create one.
              </div>
            )}
          </div>
        </Card>

        <div className="bento-stack">
          <Card className="bento-panel h-fit">
            <CardHeader>
              <div>
                <CardTitle>Priority activity</CardTitle>
                <p className="mt-1 text-sm panel-muted">Polished crypto rows with AI context.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-fuchsia-100" />
            </CardHeader>
            <CardContent className="bounded-scroll soft-scrollbar space-y-3 [--scroll-max:28rem]">
              {transactionsError ? <InlineError message={transactionsError} /> : null}
              {transactionsLoading ? (
                <TransactionSkeletons count={3} />
              ) : visibleTransactions.length ? (
                visibleTransactions.slice(0, 6).map((transaction) => (
                  <TransactionActivityRow
                    key={transaction.id}
                    transaction={transaction}
                    wallet={wallets.find((wallet) => wallet.id === transaction.walletId)}
                  />
                ))
              ) : (
                <div className="raised-row rounded-lg p-5 text-sm text-white/50">
                  No recent wallet transfers yet. Refresh a monitored wallet to ingest Alchemy activity.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bento-panel h-fit">
            <CardHeader>
              <CardTitle>Signal feed</CardTitle>
              <Bell className="h-5 w-5 text-fuchsia-100" />
            </CardHeader>
            <CardContent className="bounded-scroll soft-scrollbar space-y-3 [--scroll-max:28rem]">
              {notificationsError ? <InlineError message={notificationsError} /> : null}
              {notificationsLoading ? (
                <SignalSkeletons count={3} />
              ) : visibleNotifications.length ? (
                visibleNotifications.slice(0, 8).map((notification) => (
                  <div key={notification.id} className="raised-row rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{notification.title}</p>
                        <NotificationWalletContext
                          identity={notification.walletIdentity}
                          href={notification.walletHref}
                          compact
                          className="mt-1"
                        />
                        <p className="mt-1 text-xs leading-5 text-white/46">{notification.description}</p>
                      </div>
                      <Badge tone={notification.severity === "warning" ? "yellow" : notification.severity === "info" ? "blue" : "green"}>{notification.severity}</Badge>
                    </div>
                    <p className="mt-3 text-xs text-white/36">{notification.time} / {notification.source}</p>
                  </div>
                ))
              ) : (
                <div className="raised-row rounded-lg p-5 text-sm text-white/50">
                  No backend notifications yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Monitored accounts</h2>
            <p className="mt-1 text-sm panel-muted">Web3 account cards for the wallets powering the automation layer.</p>
          </div>
        </div>
        {walletsError ? <InlineError message={walletsError} /> : null}
        <div className="bounded-scroll soft-scrollbar grid gap-5 lg:grid-cols-3 [--scroll-max:38rem]">
          {walletsLoading ? (
            <WalletSkeletons count={3} />
          ) : visibleWallets.length ? (
            visibleWallets.map((wallet) => (
              <WalletAccountCard key={wallet.id} wallet={wallet} />
            ))
          ) : (
            <div className="raised-row rounded-lg p-5 text-sm text-white/50 lg:col-span-3">
              No backend wallets yet. Add or seed wallets to populate monitored accounts.
            </div>
          )}
        </div>
      </section>
    </div>
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

function RuleSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="panel-surface rounded-lg p-5">
      <div className="h-4 w-28 rounded-full bg-white/[0.07]" />
      <div className="mt-5 h-5 w-2/3 rounded-full bg-white/[0.08]" />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="h-16 rounded-lg bg-white/[0.045]" />
        <div className="h-16 rounded-lg bg-white/[0.045]" />
      </div>
    </div>
  ));
}

function SignalSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="raised-row rounded-lg p-4">
      <div className="h-4 w-1/2 rounded-full bg-white/[0.07]" />
      <div className="mt-3 h-3 w-full rounded-full bg-white/[0.05]" />
      <div className="mt-2 h-3 w-2/3 rounded-full bg-white/[0.05]" />
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
