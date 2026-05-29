import type { AutomationRule, NotificationEvent, ParsedAutomationRule, Transaction, Wallet } from "@/types";

export type DemoMonitoringRun = {
  enabled: boolean;
  mode: "manual-demo";
  telegramEnabled: boolean;
  startedAt: string;
  finishedAt: string;
  scannedWallets: number;
  refreshedWallets: number;
  skippedWallets: number;
  failedWallets: number;
  insertedTransactions: number;
  automationNotifications: number;
  results: Array<{
    walletId: string;
    label: string;
    chain: string;
    status: "refreshed" | "skipped" | "failed";
    message: string;
    insertedTransactionCount: number;
    automationMatchCount: number;
  }>;
};

type ApiResponse<T> = { data: T } | { error: string };

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error : "Backend request failed");
  }

  return payload.data;
}

export const backendApi = {
  ai: {
    parseRule: (prompt: string) =>
      fetchJson<ParsedAutomationRule>("/api/ai/parse-rule", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      }),
  },
  wallets: {
    list: () => fetchJson<Wallet[]>("/api/wallets"),
    create: (wallet: Pick<Wallet, "address" | "chain"> & { label: string }) =>
      fetchJson<Wallet>("/api/wallets", {
        method: "POST",
        body: JSON.stringify(wallet),
      }),
    delete: (id: string) =>
      fetchJson<{ id: string }>(`/api/wallets/${id}`, {
        method: "DELETE",
      }),
    refresh: (id: string) =>
      fetchJson<{
        wallet: Wallet;
        transactionCount: number;
        insertedTransactionCount: number;
        automationMatchCount: number;
        skipped: boolean;
        message: string;
      }>(`/api/wallets/${id}/refresh`, {
        method: "POST",
      }),
  },
  automations: {
    list: () => fetchJson<AutomationRule[]>("/api/automations"),
    create: (automation: {
      title: string;
      rawPrompt: string;
      conditionType: string;
      conditionValue: string;
      actionType: AutomationRule["action"]["channel"];
      token?: string;
      walletId?: string;
      parsedRuleJson?: unknown;
    }) =>
      fetchJson<AutomationRule>("/api/automations", {
        method: "POST",
        body: JSON.stringify(automation),
      }),
    updateStatus: (id: string, status: AutomationRule["status"]) =>
      fetchJson<AutomationRule>(`/api/automations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    update: (id: string, automation: {
      title: string;
      rawPrompt: string;
      conditionType: string;
      conditionValue: string;
      actionType: AutomationRule["action"]["channel"];
      status: AutomationRule["status"];
      token?: string;
      walletId?: string;
      parsedRuleJson?: unknown;
    }) =>
      fetchJson<AutomationRule>(`/api/automations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(automation),
      }),
    delete: (id: string) =>
      fetchJson<{ id: string }>(`/api/automations/${id}`, {
        method: "DELETE",
      }),
  },
  transactions: {
    list: (walletId?: string) => fetchJson<Transaction[]>(walletId ? `/api/transactions?walletId=${walletId}` : "/api/transactions"),
    detail: (id: string) => fetchJson<Transaction>(`/api/transactions/${id}`),
  },
  notifications: {
    list: () => fetchJson<NotificationEvent[]>("/api/notifications"),
    markRead: (id: string, read = true) =>
      fetchJson<NotificationEvent>(`/api/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ read }),
      }),
  },
  demo: {
    runMonitoring: () =>
      fetchJson<DemoMonitoringRun>("/api/demo/monitoring-run", {
        method: "POST",
      }),
  },
};
