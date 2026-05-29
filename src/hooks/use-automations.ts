"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { backendApi } from "@/lib/api/backend-client";
import { subscribeToMonitoringRunCompleted } from "@/lib/app-events";
import type { AutomationRule } from "@/types";

export type AutomationDraft = Omit<AutomationRule, "id" | "triggerCount" | "lastTriggered">;

export function useAutomations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      setRules(await backendApi.automations.list());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeToMonitoringRunCompleted(() => {
    void load(true);
  }), [load]);

  const createRule = useCallback(async (draft: AutomationDraft) => {
    setSaving(true);
    setError(null);

    try {
      const created = await backendApi.automations.create(toBackendAutomation(draft));
      setRules((current) => [created, ...current]);
      return created;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateRule = useCallback(async (id: string, draft: AutomationDraft) => {
    setPending(id, true, setPendingIds);
    setError(null);

    const previous = rules;
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, ...draft } : rule)));

    try {
      const updated = await backendApi.automations.update(id, toBackendAutomation(draft));
      setRules((current) => current.map((rule) => (rule.id === id ? updated : rule)));
      return updated;
    } catch (requestError) {
      setRules(previous);
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setPending(id, false, setPendingIds);
    }
  }, [rules]);

  const toggleRule = useCallback(async (id: string) => {
    const targetRule = rules.find((rule) => rule.id === id);
    if (!targetRule) return;

    const nextStatus = targetRule.status === "active" ? "paused" : "active";
    setPending(id, true, setPendingIds);
    setError(null);

    const previous = rules;
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, status: nextStatus } : rule)));

    try {
      const updated = await backendApi.automations.updateStatus(id, nextStatus);
      setRules((current) => current.map((rule) => (rule.id === id ? updated : rule)));
    } catch (requestError) {
      setRules(previous);
      setError(getErrorMessage(requestError));
    } finally {
      setPending(id, false, setPendingIds);
    }
  }, [rules]);

  const deleteRule = useCallback(async (id: string) => {
    setPending(id, true, setPendingIds);
    setError(null);

    const previous = rules;
    setRules((current) => current.filter((rule) => rule.id !== id));

    try {
      await backendApi.automations.delete(id);
    } catch (requestError) {
      setRules(previous);
      setError(getErrorMessage(requestError));
    } finally {
      setPending(id, false, setPendingIds);
    }
  }, [rules]);

  return useMemo(
    () => ({
      rules,
      loading,
      error,
      saving,
      pendingIds,
      refresh: load,
      createRule,
      updateRule,
      toggleRule,
      deleteRule,
    }),
    [createRule, deleteRule, error, load, loading, pendingIds, rules, saving, toggleRule, updateRule],
  );
}

function toBackendAutomation(rule: AutomationDraft) {
  return {
    title: rule.name,
    rawPrompt: rule.prompt,
    conditionType: rule.condition.field,
    conditionValue: rule.condition.value,
    actionType: rule.action.channel,
    token: extractToken(rule.condition.value),
    parsedRuleJson: {
      description: rule.description,
      condition: rule.condition,
      action: rule.action,
      walletScope: rule.walletScope,
    },
    status: rule.status,
  };
}

function extractToken(value: string) {
  const token = value.match(/\b[A-Z]{2,8}\b/)?.[0];
  return token;
}

function setPending(id: string, pending: boolean, setter: Dispatch<SetStateAction<Set<string>>>) {
  setter((current) => {
    const next = new Set(current);
    if (pending) {
      next.add(id);
    } else {
      next.delete(id);
    }
    return next;
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to sync automations";
}
