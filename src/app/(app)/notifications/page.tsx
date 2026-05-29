"use client";

import { BellRing, CheckCircle2, Radio, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationWalletContext } from "@/components/product/notification-wallet-context";
import { formatCurrency } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { useTransactions } from "@/hooks/use-transactions";

export default function NotificationsPage() {
  const { notifications, loading, error, markRead } = useNotifications();
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useTransactions();

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Triggered alerts and activity feed"
        description="Review alert severity, source rules, and the on-chain events that caused them."
      />
      <div className="grid items-start gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Triggered alerts</CardTitle>
            <BellRing className="h-5 w-5 text-fuchsia-100" />
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <InlineError message={error} /> : null}
            {loading ? (
              <NotificationSkeletons count={4} />
            ) : notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.read) void markRead(notification.id);
                  }}
                  className="raised-row interactive-row w-full rounded-lg p-4 text-left disabled:pointer-events-none"
                  disabled={notification.read}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {notification.severity === "warning" ? (
                          <TriangleAlert className="h-4 w-4 text-yellow-100" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                        )}
                        <p className="text-sm font-semibold">{notification.title}</p>
                      </div>
                      <NotificationWalletContext
                        identity={notification.walletIdentity}
                        href={notification.walletHref}
                        className="mt-2"
                      />
                      <p className="mt-2 text-sm leading-6 text-white/50">{notification.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge tone={notification.severity === "warning" ? "yellow" : notification.severity === "info" ? "blue" : "green"}>{notification.severity}</Badge>
                      {!notification.read ? <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" /> : null}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-white/38">
                    <span>{notification.source}</span>
                    <span>{notification.time}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="raised-row rounded-lg p-5 text-sm text-white/50">
                No backend notifications yet.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Activity feed</CardTitle>
            <Radio className="h-5 w-5 text-fuchsia-100" />
          </CardHeader>
          <CardContent className="space-y-3">
            {transactionsError ? <InlineError message={transactionsError} /> : null}
            {transactionsLoading ? (
              <NotificationSkeletons count={3} />
            ) : transactions.length ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="raised-row rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold capitalize">{transaction.type} / {transaction.asset}</p>
                    <p className="text-sm font-semibold">{formatCurrency(transaction.valueUsd)}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/48">{transaction.explanation}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge tone="blue">{transaction.chain}</Badge>
                    <span className="text-xs text-white/38">{transaction.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="raised-row rounded-lg p-5 text-sm text-white/50">
                No backend activity events found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NotificationSkeletons({ count }: { count: number }) {
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
    <div className="rounded-lg border border-red-300/18 bg-red-300/8 px-4 py-3 text-sm text-red-100">
      {message}
    </div>
  );
}
