"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { backendApi } from "@/lib/api/backend-client";
import { subscribeToMonitoringRunCompleted } from "@/lib/app-events";
import type { Transaction } from "@/types";

export function useTransactions(walletId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      setTransactions(await backendApi.transactions.list(walletId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load transactions");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeToMonitoringRunCompleted(() => {
    void load(true);
  }), [load]);

  const selectTransaction = useCallback(async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailLoading(true);
    setDetailError(null);

    try {
      setSelectedTransaction(await backendApi.transactions.detail(transaction.id));
    } catch (loadError) {
      setDetailError(loadError instanceof Error ? loadError.message : "Unable to load transaction details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearSelectedTransaction = useCallback(() => {
    setSelectedTransaction(null);
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  const summary = useMemo(() => ({
    confirmed: transactions.filter((transaction) => transaction.status === "confirmed").length,
    pending: transactions.filter((transaction) => transaction.status === "pending").length,
    flagged: transactions.filter((transaction) => transaction.status === "flagged").length,
    totalValue: transactions.reduce((sum, transaction) => sum + transaction.valueUsd, 0),
  }), [transactions]);

  return {
    transactions,
    loading,
    error,
    reload: load,
    selectedTransaction,
    detailLoading,
    detailError,
    selectTransaction,
    clearSelectedTransaction,
    summary,
  };
}
