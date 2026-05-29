import type { NotificationEvent } from "@/types";
import {
  formatCompactTokenAmount,
  formatPhilippineNotificationTime,
  formatWalletIdentity,
} from "@/services/format";
import { isSuspiciousTokenLabel } from "@/services/blockchain/safety";
import type { AppSupabaseClient, NotificationRow, WalletRow } from "@/services/types";

export async function getNotifications(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const walletMap = await getWalletContextMap(
    supabase,
    userId,
    (data ?? []).map((row) => row.wallet_id),
  );

  return data
    .filter((row) => !isSuspiciousTokenLabel(row.title) && !isSuspiciousTokenLabel(row.message))
    .map((row) => mapNotification(row, walletMap.get(row.wallet_id ?? "")));
}

export async function markNotificationRead(
  supabase: AppSupabaseClient,
  userId: string,
  id: string,
  read: boolean,
) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  const wallet = data.wallet_id
    ? await getWalletContext(supabase, userId, data.wallet_id)
    : null;

  return mapNotification(data, wallet);
}

async function getWalletContextMap(
  supabase: AppSupabaseClient,
  userId: string,
  walletIds: Array<string | null>,
) {
  const ids = [...new Set(walletIds.filter(Boolean))] as string[];
  if (!ids.length) return new Map<string, Pick<WalletRow, "id" | "label" | "address" | "chain">>();

  const { data, error } = await supabase
    .from("wallets")
    .select("id, label, address, chain")
    .eq("user_id", userId)
    .in("id", ids);

  if (error) throw error;

  return new Map(
    (data ?? []).map((wallet) => [
      wallet.id,
      wallet,
    ]),
  );
}

async function getWalletContext(
  supabase: AppSupabaseClient,
  userId: string,
  walletId: string,
) {
  const { data, error } = await supabase
    .from("wallets")
    .select("id, label, address, chain")
    .eq("user_id", userId)
    .eq("id", walletId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function mapNotification(
  row: NotificationRow,
  wallet?: Pick<WalletRow, "id" | "label" | "address" | "chain"> | null,
): NotificationEvent {
  return {
    id: row.id,
    title: row.title,
    description: compactNotificationDescription(row.message),
    severity: row.type,
    time: formatPhilippineNotificationTime(row.created_at),
    source: row.automation_rule_id ? "Automation engine" : "Supabase backend",
    walletIdentity: wallet ? formatWalletIdentity(wallet) : undefined,
    walletHref: wallet ? `/wallets?wallet=${wallet.id}` : undefined,
    read: row.read,
  };
}

function compactNotificationDescription(message: string) {
  return message.replace(
    /\b(sent|received|moved)\s+([0-9][0-9,]*(?:\.[0-9]+)?)\s+([A-Za-z0-9.$_-]{2,24})\s+on\b/g,
    (_match, direction: string, rawAmount: string, token: string) => {
      const amount = Number(rawAmount.replaceAll(",", ""));
      if (!Number.isFinite(amount)) return _match;
      return `${direction} ${formatCompactTokenAmount(amount, token)} on`;
    },
  );
}
