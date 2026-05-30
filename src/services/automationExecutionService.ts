import type { AppSupabaseClient, AutomationRuleRow, TransactionRow, WalletRow } from "@/services/types";
import { formatCompactTokenAmount, parseNumber } from "@/services/format";
import { sendTelegramAutomationDigest } from "@/services/telegramNotificationService";

type SupportedRuleType = "transfer_amount" | "receive_amount" | "token_movement";

interface ExecutionInput {
  userId: string;
  wallet: Pick<WalletRow, "id" | "label" | "address" | "chain">;
  transactions: TransactionRow[];
  forceTelegramDelivery?: boolean;
}

interface MatchedRule {
  rule: AutomationRuleRow;
  transaction: TransactionRow;
  direction: "sent" | "received" | "moved";
}

const supportedRuleTypes = new Set<SupportedRuleType>([
  "transfer_amount",
  "receive_amount",
  "token_movement",
]);

export async function evaluateAutomationRulesForTransactions(
  supabase: AppSupabaseClient,
  input: ExecutionInput,
) {
  if (!input.transactions.length) return 0;

  const rules = await getActiveRules(supabase, input.userId, input.wallet.id);
  if (!rules.length) return 0;

  const matches = input.transactions.flatMap((transaction) =>
    rules
      .filter((rule) => matchesRule(rule, transaction, input.wallet.address))
      .map((rule): MatchedRule => ({
        rule,
        transaction,
        direction: getDirection(transaction, input.wallet.address),
      })),
  );

  if (!matches.length) return 0;

  return createNotificationsForMatches(supabase, input.userId, input.wallet, matches, {
    forceTelegramDelivery: input.forceTelegramDelivery,
  });
}

async function getActiveRules(supabase: AppSupabaseClient, userId: string, walletId: string) {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`wallet_id.is.null,wallet_id.eq.${walletId}`);

  if (error) throw error;

  return (data ?? []).filter((rule) =>
    supportedRuleTypes.has(rule.condition_type as SupportedRuleType),
  );
}

function matchesRule(rule: AutomationRuleRow, transaction: TransactionRow, walletAddress: string) {
  if (transaction.type !== "transfer") return false;
  if (!matchesToken(rule.token, transaction.token)) return false;

  const direction = getDirection(transaction, walletAddress);
  const threshold = parseNumber(rule.condition_value, 0);

  if (rule.condition_type === "transfer_amount") {
    return direction === "sent" && transaction.amount > threshold;
  }

  if (rule.condition_type === "receive_amount") {
    return direction === "received" && transaction.amount > threshold;
  }

  if (rule.condition_type === "token_movement") {
    return threshold > 0 ? transaction.amount > threshold : true;
  }

  return false;
}

function matchesToken(ruleToken: string | null, transactionToken: string) {
  if (!ruleToken) return true;
  return ruleToken.toUpperCase() === transactionToken.toUpperCase();
}

function getDirection(transaction: TransactionRow, walletAddress: string): MatchedRule["direction"] {
  const wallet = walletAddress.toLowerCase();
  if (transaction.from_address.toLowerCase() === wallet) return "sent";
  if (transaction.to_address.toLowerCase() === wallet) return "received";
  return "moved";
}

async function createNotificationsForMatches(
  supabase: AppSupabaseClient,
  userId: string,
  wallet: Pick<WalletRow, "id" | "label" | "address" | "chain">,
  matches: MatchedRule[],
  options: { forceTelegramDelivery?: boolean } = {},
) {
  const existing = await getExistingNotificationKeys(supabase, matches);
  const notifications = matches
    .filter((match) => !existing.has(toNotificationKey(match)))
    .map((match) => ({
      match,
      notification: {
        user_id: userId,
        automation_rule_id: match.rule.id,
        wallet_id: wallet.id,
        transaction_id: match.transaction.id,
        title: `${match.rule.title} triggered`,
        message: buildNotificationMessage(wallet, match),
        type: "success" as const,
        read: false,
      },
    }));

  if (!notifications.length) return 0;

  const { data, error } = await supabase
    .from("notifications")
    .insert(notifications.map((item) => item.notification))
    .select("id, created_at");

  if (error) {
    if (error.code === "23505") return 0;
    throw error;
  }

  const insertedCount = data?.length ?? 0;
  if (insertedCount > 0) {
    await deliverTelegramAlerts(
      wallet,
      notifications.slice(0, insertedCount).map((item) => item.match),
      getDigestCreatedAt(data),
      { forceTelegramDelivery: options.forceTelegramDelivery },
    );
  }

  return insertedCount;
}

async function getExistingNotificationKeys(supabase: AppSupabaseClient, matches: MatchedRule[]) {
  const ruleIds = [...new Set(matches.map((match) => match.rule.id))];
  const transactionIds = [...new Set(matches.map((match) => match.transaction.id))];

  const { data, error } = await supabase
    .from("notifications")
    .select("automation_rule_id, wallet_id, transaction_id")
    .in("automation_rule_id", ruleIds)
    .in("transaction_id", transactionIds);

  if (error) throw error;

  return new Set(
    (data ?? [])
      .filter((row) => row.automation_rule_id && row.wallet_id && row.transaction_id)
      .map((row) => `${row.automation_rule_id}:${row.wallet_id}:${row.transaction_id}`),
  );
}

function toNotificationKey(match: MatchedRule) {
  return `${match.rule.id}:${match.transaction.wallet_id}:${match.transaction.id}`;
}

function buildNotificationMessage(
  wallet: Pick<WalletRow, "label" | "chain">,
  match: MatchedRule,
) {
  const amount = formatCompactTokenAmount(match.transaction.amount, match.transaction.token);

  return `${wallet.label} ${match.direction} ${amount} on ${wallet.chain}. Transaction ${match.transaction.hash.slice(0, 10)}... matched automation rule "${match.rule.title}".`;
}

async function deliverTelegramAlerts(
  wallet: Pick<WalletRow, "label" | "address" | "chain">,
  matches: MatchedRule[],
  notificationCreatedAt: string,
  options: { forceTelegramDelivery?: boolean } = {},
) {
  await sendTelegramAutomationDigest({
    wallet,
    notificationCreatedAt,
    matches: matches.map((match) => ({
      rule: match.rule,
      transaction: match.transaction,
      direction: match.direction,
    })),
  }, { force: options.forceTelegramDelivery });
}

function getDigestCreatedAt(rows: Array<{ created_at: string }> | null) {
  const timestamps = (rows ?? [])
    .map((row) => new Date(row.created_at).getTime())
    .filter(Number.isFinite);

  if (!timestamps.length) return new Date().toISOString();

  return new Date(Math.max(...timestamps)).toISOString();
}
