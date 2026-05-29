"use client";

import { create } from "zustand";
import { automationRules, notifications as mockNotifications } from "@/lib/mock-data";
import type { AutomationRule, NotificationEvent, Transaction } from "@/types";

interface AppState {
  rules: AutomationRule[];
  notifications: NotificationEvent[];
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (transaction: Transaction | null) => void;
  addRule: (rule: Omit<AutomationRule, "id" | "triggerCount" | "lastTriggered">) => AutomationRule;
  updateRule: (id: string, patch: Partial<AutomationRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  addNotification: (notification: Omit<NotificationEvent, "id" | "time" | "read">) => void;
  markNotificationsRead: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  rules: automationRules,
  notifications: mockNotifications.map((notification) => ({ ...notification, read: false })),
  selectedTransaction: null,
  setSelectedTransaction: (transaction) => set({ selectedTransaction: transaction }),
  addRule: (rule) => {
    const createdRule: AutomationRule = {
      ...rule,
      id: `r${Date.now()}`,
      triggerCount: 1,
      lastTriggered: "Just now",
    };

    set((state) => ({
      rules: [createdRule, ...state.rules],
      notifications: [
        createNotification({
          title: "Automation saved",
          description: `${createdRule.name} is active for ${createdRule.walletScope}.`,
          severity: "success",
          source: createdRule.name,
        }),
        createNotification({
          title: "Simulated rule signal",
          description: `Demo activity matched: ${createdRule.condition.field} ${createdRule.condition.operator} ${createdRule.condition.value}.`,
          severity: "info",
          source: createdRule.name,
        }),
        ...state.notifications,
      ],
    }));

    return createdRule;
  },
  updateRule: (id, patch) =>
    set((state) => ({
      rules: state.rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
      notifications: [
        createNotification({
          title: "Automation updated",
          description: `${state.rules.find((rule) => rule.id === id)?.name ?? "Automation"} was updated in local state.`,
          severity: "info",
          source: "Rule editor",
        }),
        ...state.notifications,
      ],
    })),
  deleteRule: (id) =>
    set((state) => {
      const deletedRule = state.rules.find((rule) => rule.id === id);
      return {
        rules: state.rules.filter((rule) => rule.id !== id),
        notifications: deletedRule
          ? [
              createNotification({
                title: "Automation deleted",
                description: `${deletedRule.name} was removed from active rules.`,
                severity: "warning",
                source: deletedRule.name,
              }),
              ...state.notifications,
            ]
          : state.notifications,
      };
    }),
  toggleRule: (id) =>
    set((state) => {
      const targetRule = state.rules.find((rule) => rule.id === id);
      const nextStatus = targetRule?.status === "active" ? "paused" : "active";

      return {
        rules: state.rules.map((rule) =>
          rule.id === id
            ? { ...rule, status: nextStatus }
            : rule,
        ),
        notifications: targetRule
          ? [
              createNotification({
                title: nextStatus === "active" ? "Automation enabled" : "Automation paused",
                description: `${targetRule.name} is now ${nextStatus}.`,
                severity: nextStatus === "active" ? "success" : "info",
                source: targetRule.name,
              }),
              ...state.notifications,
            ]
          : state.notifications,
      };
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [createNotification(notification), ...state.notifications],
    })),
  markNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
    })),
}));

function createNotification(notification: Omit<NotificationEvent, "id" | "time" | "read">): NotificationEvent {
  return {
    ...notification,
    id: `n${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: "Just now",
    read: false,
  };
}
