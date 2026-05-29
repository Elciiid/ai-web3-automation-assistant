import { isDisplaySafeToken, isSuspiciousTokenLabel } from "@/services/blockchain/safety";
import {
  formatCompactTokenAmount,
  formatPhilippineTime,
  formatWalletIdentity,
} from "@/services/format";
import type { AutomationRuleRow, TransactionRow, WalletRow } from "@/services/types";

export type TelegramDigestMatch = {
  rule: Pick<AutomationRuleRow, "title" | "condition_type">;
  transaction: Pick<TransactionRow, "hash" | "token" | "amount" | "timestamp" | "ai_summary">;
  direction: "sent" | "received" | "moved";
};

type TelegramDigestInput = {
  wallet: Pick<WalletRow, "label" | "address" | "chain">;
  matches: TelegramDigestMatch[];
  notificationCreatedAt: string;
};

type Severity = "routine" | "significant" | "high";

type AggregatedActivity = {
  severity: Severity;
  visibleMatches: TelegramDigestMatch[];
  hiddenLowTrustCount: number;
  transferCount: number;
  uniqueAssetCount: number;
  dominantToken: string;
  largestMatch: TelegramDigestMatch | null;
  dominantDirection: TelegramDigestMatch["direction"];
  ruleNames: string[];
  directionCounts: Record<string, number>;
};

export function formatTelegramDigest(input: TelegramDigestInput) {
  const activity = aggregateActivity(input.matches);

  return [
    formatHeading(activity.severity),
    "",
    `&#127974; ${escapeHtml(formatWalletLine(input.wallet))}`,
    "",
    "&#128202; <b>Activity</b>",
    escapeHtml(formatActivitySummary(activity)),
    "",
    "&#128200; <b>Largest Movement</b>",
    escapeHtml(formatLargestMovement(activity)),
    "",
    "&#129504; <b>AI Insight</b>",
    escapeHtml(buildBatchInsight(activity)),
    "",
    ...formatKeyMovements(activity),
    `&#9881;&#65039; <b>Automation</b>`,
    escapeHtml(formatRules(activity.ruleNames, activity)),
    "",
    `&#128338; ${escapeHtml(formatPhilippineTime(input.notificationCreatedAt))}`,
  ].join("\n");
}

function aggregateActivity(matches: TelegramDigestMatch[]): AggregatedActivity {
  const visibleMatches = matches.filter((match) => isTrustedMatch(match));
  const hiddenLowTrustCount = matches.length - visibleMatches.length;
  const analysisMatches = visibleMatches.length ? visibleMatches : matches;
  const uniqueAssets = new Set(analysisMatches.map((match) => normalizeToken(match.transaction.token)));
  const tokenCounts = countBy(analysisMatches.map((match) => normalizeToken(match.transaction.token)));
  const directionCounts = countBy(analysisMatches.map((match) => match.direction));
  const largestMatch = analysisMatches.reduce<TelegramDigestMatch | null>(
    (largest, match) => (!largest || match.transaction.amount > largest.transaction.amount ? match : largest),
    null,
  );

  return {
    severity: classifySeverity(matches, largestMatch, hiddenLowTrustCount),
    visibleMatches,
    hiddenLowTrustCount,
    transferCount: matches.length,
    uniqueAssetCount: uniqueAssets.size,
    dominantToken: getTopEntry(tokenCounts) ?? "multiple assets",
    largestMatch,
    dominantDirection: (getTopEntry(directionCounts) as TelegramDigestMatch["direction"] | null) ?? "moved",
    ruleNames: [...new Set(matches.map((match) => match.rule.title))],
    directionCounts,
  };
}

function isTrustedMatch(match: TelegramDigestMatch) {
  const token = match.transaction.token;
  if (isSuspiciousTokenLabel(token)) return false;
  if (!isDisplaySafeToken(token)) return false;
  if (match.transaction.amount >= 100_000_000 && !isStablecoin(token) && !isNativeToken(token)) return false;
  return true;
}

function classifySeverity(
  matches: TelegramDigestMatch[],
  largestMatch: TelegramDigestMatch | null,
  hiddenLowTrustCount: number,
): Severity {
  const largestAmount = largestMatch?.transaction.amount ?? 0;
  const largestToken = largestMatch?.transaction.token ?? "";

  if (isStablecoin(largestToken) && largestAmount >= 10_000) return "high";
  if (matches.length >= 10 || hiddenLowTrustCount >= 5) return "significant";
  if (largestAmount >= 1_000_000 && !isNativeToken(largestToken)) return "significant";
  return "routine";
}

function formatHeading(severity: Severity) {
  if (severity === "high") return "&#128308; <b>High-Volume Transfer</b>";
  if (severity === "significant") return "&#128993; <b>Significant Token Movement</b>";
  return "&#128994; <b>Routine Wallet Activity</b>";
}

function formatActivitySummary(activity: AggregatedActivity) {
  const direction = directionLabel(activity.dominantDirection);
  const countText = `${activity.transferCount} ${direction} transfer${activity.transferCount === 1 ? "" : "s"}`;
  const assetText = `${activity.uniqueAssetCount} asset${activity.uniqueAssetCount === 1 ? "" : "s"}`;
  const lowTrustText = activity.hiddenLowTrustCount
    ? ` ${activity.hiddenLowTrustCount} low-trust transfer${activity.hiddenLowTrustCount === 1 ? "" : "s"} suppressed.`
    : "";

  return `${countText} across ${assetText}.${lowTrustText}`;
}

function formatLargestMovement(activity: AggregatedActivity) {
  if (!activity.largestMatch) return "No trusted movement surfaced.";

  return `${formatCompactTokenAmount(activity.largestMatch.transaction.amount, normalizeToken(activity.largestMatch.transaction.token))} ${directionLabel(activity.largestMatch.direction)}`;
}

function buildBatchInsight(activity: AggregatedActivity) {
  if (activity.hiddenLowTrustCount >= 5) {
    return `Low-trust asset activity dominated this cycle; noisy token details were suppressed.`;
  }

  if (activity.severity === "high") {
    return `High-volume ${directionLabel(activity.dominantDirection)} movement observed, led by ${activity.dominantToken}.`;
  }

  if (activity.transferCount >= 8) {
    return `Repeated ${directionLabel(activity.dominantDirection)} activity detected across multiple assets.`;
  }

  if (isStablecoin(activity.dominantToken)) {
    return `Stablecoin movement pattern observed during this monitoring cycle.`;
  }

  return `Wallet activity matched automation rules without requiring escalation.`;
}

function formatKeyMovements(activity: AggregatedActivity) {
  const movements = activity.visibleMatches
    .slice()
    .sort((a, b) => b.transaction.amount - a.transaction.amount)
    .slice(0, 2);

  if (!movements.length) return [];

  return [
    "&#128204; <b>Key Movements</b>",
    ...movements.map((match) => `&#8226; ${escapeHtml(formatMovement(match))}`),
    "",
  ];
}

function formatRules(ruleNames: string[], activity: AggregatedActivity) {
  const normalized = [...new Set(ruleNames.map((name) => normalizeAutomationName(name, activity)))];
  const shown = normalized.slice(0, 2).join(", ");
  return normalized.length > 2 ? `${shown}, ...` : shown;
}

function normalizeToken(token: string) {
  return token.trim().toUpperCase();
}

function directionLabel(direction: TelegramDigestMatch["direction"]) {
  if (direction === "sent") return "outbound";
  if (direction === "received") return "inbound";
  return "token movement";
}

function formatWalletLine(wallet: Pick<WalletRow, "label" | "address" | "chain">) {
  return formatWalletIdentity({
    ...wallet,
    label: normalizeWalletLabel(wallet.label),
  });
}

function normalizeWalletLabel(label: string) {
  return label
    .replace(/\bDemo\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAutomationName(name: string, activity: AggregatedActivity) {
  const normalized = name.toLowerCase();
  if (normalized.includes("demo") || normalized.includes("token movement monitor")) {
    if (activity.severity === "high") return "High-Value Token Movement";
    if (activity.dominantToken && isStablecoin(activity.dominantToken)) return "Stablecoin Movement Watch";
    return "Wallet Activity Monitor";
  }

  if (normalized.includes("large stablecoin")) return "Large Stablecoin Transfer Alert";
  if (normalized.includes("unknown approval")) return "Approval Exposure Monitor";
  return name;
}

function formatMovement(match: TelegramDigestMatch) {
  return `${formatCompactTokenAmount(match.transaction.amount, normalizeToken(match.transaction.token))} ${directionLabel(match.direction)}`;
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function getTopEntry(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function isStablecoin(token: string) {
  return ["USDC", "USDT", "DAI", "USDE", "PYUSD"].includes(normalizeToken(token));
}

function isNativeToken(token: string) {
  return ["ETH", "WETH", "MATIC"].includes(normalizeToken(token));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
