"use client";

import { BellRing, CheckCircle2, Radio, Send, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationWalletContext } from "@/components/product/notification-wallet-context";
import { formatCurrency } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { useTransactions } from "@/hooks/use-transactions";
import { usePageSearch } from "@/hooks/use-page-search";
import { useState } from "react";
import type { NotificationEvent } from "@/types";

export default function NotificationsPage() {
  const pageSearch = usePageSearch();
  const [selectedNotification, setSelectedNotification] = useState<NotificationEvent | null>(null);
  const { notifications, loading, error, markRead } = useNotifications();
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useTransactions();
  const matchesSearch = (...values: Array<string | number | undefined | null>) =>
    !pageSearch || values.some((value) => String(value ?? "").toLowerCase().includes(pageSearch));
  const visibleNotifications = notifications.filter((notification) =>
    matchesSearch(notification.title, notification.description, notification.source, notification.severity, notification.walletIdentity),
  );
  const visibleTransactions = transactions.filter((transaction) =>
    matchesSearch(transaction.asset, transaction.chain, transaction.hash, transaction.explanation, transaction.type, transaction.status),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Triggered alerts and activity feed"
        description="Review alert severity, source rules, and the on-chain events that caused them."
        action={(
          <Button asChild variant="secondary">
            <a
              href="https://t.me/unitflowalerts"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View UnitFlow Alerts Telegram channel"
            >
              <Send className="h-4 w-4" />
              Live Alerts Channel
            </a>
          </Button>
        )}
      />
      <div className="bento-grid items-stretch lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bento-panel flex h-full min-h-0 flex-col">
          <CardHeader>
            <CardTitle>Triggered alerts</CardTitle>
            <BellRing className="h-5 w-5 text-fuchsia-100" />
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="sticky-panel-header">
              <p className="text-sm text-white/44">
                {pageSearch ? `Filtered by "${pageSearch}".` : "Click an alert to open a bounded detail drawer."}
              </p>
            </div>
            <div className="bounded-scroll soft-scrollbar h-[38rem] space-y-3 [--scroll-max:38rem]">
            {error ? <InlineError message={error} /> : null}
            {loading ? (
              <NotificationSkeletons count={4} />
            ) : visibleNotifications.length ? (
              visibleNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.read) void markRead(notification.id);
                    setSelectedNotification(notification);
                  }}
                  className="raised-row interactive-row w-full rounded-lg p-4 text-left disabled:pointer-events-none"
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
            </div>
          </CardContent>
        </Card>
        <Card className="bento-panel flex h-full min-h-0 flex-col">
          <CardHeader>
            <CardTitle>Activity feed</CardTitle>
            <Radio className="h-5 w-5 text-fuchsia-100" />
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="bounded-scroll soft-scrollbar h-[40rem] space-y-3 [--scroll-max:40rem]">
              {transactionsError ? <InlineError message={transactionsError} /> : null}
              {transactionsLoading ? (
                <NotificationSkeletons count={3} />
              ) : visibleTransactions.length ? (
                visibleTransactions.map((transaction) => (
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
            </div>
          </CardContent>
        </Card>
      </div>
      <AnimatePresence>
        {selectedNotification ? (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <button className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedNotification(null)} />
            <motion.aside
              className="panel-surface relative h-full w-full max-w-lg overflow-y-auto border-l border-white/10 p-6"
              initial={{ x: 32, opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone={selectedNotification.severity === "warning" ? "yellow" : selectedNotification.severity === "info" ? "blue" : "green"}>
                    {selectedNotification.severity}
                  </Badge>
                  <h2 className="mt-4 text-2xl font-semibold">{selectedNotification.title}</h2>
                  <NotificationWalletContext
                    identity={selectedNotification.walletIdentity}
                    href={selectedNotification.walletHref}
                    className="mt-3"
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNotification(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="glass-subtle mt-6 rounded-lg p-5">
                <p className="text-xs font-semibold uppercase text-white/38">Operational context</p>
                <p className="mt-3 text-sm leading-7 text-white/64">{selectedNotification.description}</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Detail label="Source" value={selectedNotification.source} />
                <Detail label="Time" value={selectedNotification.time} />
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
      <p className="mt-2 truncate text-sm font-semibold text-white/78">{value}</p>
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
