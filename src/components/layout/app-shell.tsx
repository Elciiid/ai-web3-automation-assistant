"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Bot,
  CheckCircle2,
  Gauge,
  Menu,
  Search,
  Settings,
  Sparkles,
  Table2,
  TriangleAlert,
  WalletCards,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotificationWalletContext } from "@/components/product/notification-wallet-context";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/wallets", label: "Wallets", icon: WalletCards },
  { href: "/automations", label: "Automations", icon: Workflow },
  { href: "/builder", label: "AI Builder", icon: Bot },
  { href: "/transactions", label: "Transactions", icon: Table2 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-radial-bg workspace-shell">
      <div className="noise-overlay" />
      <Sidebar className="hidden lg:flex" />
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/62 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <Sidebar className="relative flex h-full w-64" onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
      <div className="relative z-10 lg:pl-64">
        <Topbar onMenu={() => setOpen(true)} />
        <motion.main
          key={usePathname()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="mx-auto w-full max-w-[86rem] px-4 pb-7 pt-24 sm:px-6 sm:pb-8 lg:px-10"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "workspace-sidebar fixed inset-y-0 left-0 z-40 w-64 flex-col px-3.5 py-5",
        className,
      )}
    >
      <div className="mb-7 flex items-center justify-between px-1.5">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="workspace-brand-mark grid h-8 w-8 place-items-center rounded-lg text-white/86">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-5 text-white/90">AI Web3</p>
            <p className="text-[11px] text-white/36">Automation Assistant</p>
          </div>
        </Link>
        <button className="workspace-icon-button rounded-full p-2 lg:hidden" onClick={onNavigate}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "workspace-nav-item",
                active && "workspace-nav-item-active",
              )}
            >
              <Icon className="h-4 w-4 opacity-80" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="workspace-status-line mt-auto px-1.5 pt-5">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
          AI monitoring active
        </div>
        <p className="mt-2 text-xs leading-5">
          3 wallets / 24 rules / 5 chains
        </p>
      </div>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
  } = useNotifications();

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function updatePageSearch(value: string) {
    setSearchValue(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <header className="workspace-topbar fixed left-0 right-0 top-0 z-30 lg:left-64">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button className="workspace-icon-button rounded-full p-2 lg:hidden" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </button>
        <label className={cn(
          "workspace-search hidden h-10 min-w-0 flex-1 items-center gap-3 rounded-full px-4 text-sm md:flex",
          searchValue.trim() && "border-fuchsia-200/20 bg-white/[0.045] text-white/72",
        )}>
          <Search className="h-4 w-4 text-white/42" />
          <input
            value={searchValue}
            onChange={(event) => updatePageSearch(event.target.value)}
            placeholder="Search this page: wallets, hashes, rules, chains, alerts"
            className="min-w-0 flex-1 bg-transparent text-sm text-white/72 outline-none placeholder:text-white/34"
          />
          {searchValue.trim() ? (
            <span className="rounded-full border border-fuchsia-200/18 bg-fuchsia-200/8 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-100">
              Filtering
            </span>
          ) : null}
        </label>
        <div className="ml-auto flex items-center gap-2.5">
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Sparkles className="h-4 w-4" />
            New rule
          </Button>
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              className="workspace-icon-button relative rounded-full p-2.5"
              aria-label={`${unreadCount} unread notifications`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-[#121214] bg-fuchsia-300 px-1 text-[10px] font-bold text-black">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#18181c]/96 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <p className="text-xs text-white/42">{unreadCount ? `${unreadCount} unread alerts` : "All caught up"}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-fuchsia-100 transition hover:bg-white/[0.06]"
                    onClick={() => void markAllRead()}
                  >
                    Mark read
                  </button>
                </div>

                <div className="max-h-[24rem] overflow-y-auto p-2">
                  {error ? (
                    <div className="rounded-xl border border-red-300/18 bg-red-300/8 px-3 py-2 text-sm text-red-100">
                      {error}
                    </div>
                  ) : loading ? (
                    <NotificationPopoverSkeleton />
                  ) : notifications.length ? (
                    notifications.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className="flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.055]"
                        onClick={() => {
                          if (!notification.read) void markRead(notification.id);
                        }}
                      >
                        <span className={cn(
                          "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border",
                          notification.severity === "warning"
                            ? "border-yellow-300/20 bg-yellow-300/10 text-yellow-100"
                            : notification.severity === "critical"
                              ? "border-red-300/20 bg-red-300/10 text-red-100"
                              : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
                        )}>
                          {notification.severity === "warning" || notification.severity === "critical" ? (
                            <TriangleAlert className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="line-clamp-1 text-sm font-semibold text-white">{notification.title}</span>
                            {!notification.read ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fuchsia-300" /> : null}
                          </span>
                          <NotificationWalletContext
                            identity={notification.walletIdentity}
                            compact
                            className="mt-1"
                          />
                          <span className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">{notification.description}</span>
                          <span className="mt-2 flex items-center gap-2">
                            <Badge tone={notification.severity === "warning" ? "yellow" : notification.severity === "info" ? "blue" : notification.severity === "critical" ? "red" : "green"}>
                              {notification.severity}
                            </Badge>
                            <span className="text-xs text-white/36">{notification.time}</span>
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl px-4 py-8 text-center">
                      <p className="text-sm font-semibold text-white">No notifications yet</p>
                      <p className="mt-1 text-xs leading-5 text-white/42">
                        Automation-triggered alerts will appear here.
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  href="/notifications"
                  className="block border-t border-white/8 px-4 py-3 text-center text-sm font-semibold text-white/78 transition hover:bg-white/[0.045] hover:text-white"
                  onClick={() => setNotificationsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            ) : null}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.09] text-xs font-semibold text-white/86">
            AW
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationPopoverSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-xl px-3 py-3">
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-full bg-white/[0.06]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/3 rounded-full bg-white/[0.07]" />
              <div className="mt-2 h-3 w-full rounded-full bg-white/[0.05]" />
              <div className="mt-2 h-3 w-1/2 rounded-full bg-white/[0.05]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
