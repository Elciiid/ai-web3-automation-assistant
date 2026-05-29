"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { backendApi } from "@/lib/api/backend-client";
import { subscribeToMonitoringRunCompleted } from "@/lib/app-events";
import type { Chain, Wallet } from "@/types";

export interface WalletDraft {
  label?: string;
  address: string;
  chain: Chain;
}

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [refreshingIds, setRefreshingIds] = useState<string[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      setWallets(await backendApi.wallets.list());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load wallets");
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

  const createWallet = useCallback(async (draft: WalletDraft) => {
    setSaving(true);
    setError(null);

    try {
      const created = await backendApi.wallets.create({
        address: draft.address,
        chain: draft.chain,
        label: draft.label?.trim() || `${draft.chain} wallet`,
      });
      setWallets((currentWallets) => [created, ...currentWallets]);
      return created;
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Unable to add wallet";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteWallet = useCallback(async (id: string) => {
    const previousWallets = wallets;
    setPendingDeleteIds((ids) => [...ids, id]);
    setError(null);
    setWallets((currentWallets) => currentWallets.filter((wallet) => wallet.id !== id));

    try {
      await backendApi.wallets.delete(id);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete wallet";
      setWallets(previousWallets);
      setError(message);
      throw new Error(message);
    } finally {
      setPendingDeleteIds((ids) => ids.filter((pendingId) => pendingId !== id));
    }
  }, [wallets]);

  const refreshWallet = useCallback(async (id: string) => {
    setRefreshingIds((ids) => [...ids, id]);
    setError(null);

    try {
      const result = await backendApi.wallets.refresh(id);
      setWallets((currentWallets) =>
        currentWallets.map((wallet) => (wallet.id === id ? result.wallet : wallet)),
      );
      return result;
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : "Unable to refresh wallet";
      setError(message);
      throw new Error(message);
    } finally {
      setRefreshingIds((ids) => ids.filter((refreshingId) => refreshingId !== id));
    }
  }, []);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, wallet) => sum + wallet.balanceUsd, 0),
    [wallets],
  );

  const chainCount = useMemo(
    () => new Set(wallets.map((wallet) => wallet.chain)).size,
    [wallets],
  );

  return {
    wallets,
    loading,
    error,
    reload: load,
    createWallet,
    deleteWallet,
    refreshWallet,
    saving,
    pendingDeleteIds,
    refreshingIds,
    totalBalance,
    chainCount,
  };
}
