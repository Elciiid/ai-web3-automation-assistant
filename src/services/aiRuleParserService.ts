import type { ParsedAutomationRule, ParsedRuleActionType, ParsedRuleIntent, RuleAction } from "@/types";
import {
  generateGeminiText,
  getGeminiRuleParserModel,
  isGeminiConfigured,
  parseGeminiJson,
} from "@/services/geminiProviderService";

type SupportedConditionType = ParsedAutomationRule["condition_type"];

interface ParsedRuleCandidate {
  title: string;
  description: string;
  intent: ParsedRuleIntent;
  condition_type: SupportedConditionType;
  condition_value: number | null;
  token: string | null;
  action_type: ParsedRuleActionType;
  monitored_scope: string;
  condition: {
    field: string;
    operator: string;
    value: string;
  };
  action: RuleAction;
  walletScope: string;
}

const supportedTokens = ["USDT", "USDC", "ETH", "WETH", "DAI", "WBTC"] as const;
const supportedActions = ["notify", "summarize"] as const satisfies readonly ParsedRuleActionType[];
const supportedConditions = ["transfer_amount", "receive_amount", "token_movement", "daily_wallet_summary"] as const satisfies readonly SupportedConditionType[];
const geminiRuleParserSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    intent: {
      type: "string",
      enum: ["transfer_threshold", "receive_threshold", "token_movement", "daily_summary"],
    },
    condition_type: {
      type: "string",
      enum: ["transfer_amount", "receive_amount", "token_movement", "daily_wallet_summary"],
    },
    condition_value: { type: ["number", "null"] },
    token: { type: ["string", "null"] },
    action_type: { type: "string", enum: ["notify", "summarize"] },
    monitored_scope: { type: "string" },
    condition: {
      type: "object",
      properties: {
        field: { type: "string" },
        operator: { type: "string" },
        value: { type: "string" },
      },
      required: ["field", "operator", "value"],
    },
    action: {
      type: "object",
      properties: {
        channel: { type: "string", enum: ["email", "telegram", "slack", "webhook", "in-app"] },
        message: { type: "string" },
      },
      required: ["channel", "message"],
    },
    walletScope: { type: "string" },
  },
  required: [
    "title",
    "description",
    "intent",
    "condition_type",
    "condition_value",
    "token",
    "action_type",
    "monitored_scope",
    "condition",
    "action",
    "walletScope",
  ],
};

export class RuleParseError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_prompt" | "unsupported_intent" | "malformed_rule",
  ) {
    super(message);
  }
}

export async function parseAutomationRuleIntent(prompt: string): Promise<ParsedAutomationRule> {
  const normalizedPrompt = normalizePrompt(prompt);

  if (isGeminiConfigured()) {
    try {
      logGeminiParser("attempted");
      const candidate = await parseWithGemini(normalizedPrompt);
      const parsed = validateParsedRule(candidate);
      logGeminiParser("success");
      return parsed;
    } catch (error) {
      logGeminiParser("fallback", error);
    }
  }

  return parseAutomationRuleIntentDeterministic(normalizedPrompt);
}

export function parseAutomationRuleIntentDeterministic(prompt: string): ParsedAutomationRule {
  const normalizedPrompt = normalizePrompt(prompt);
  const candidate = parseWithDeterministicFallback(normalizedPrompt);

  return validateParsedRule(candidate);
}

async function parseWithGemini(prompt: string): Promise<ParsedRuleCandidate> {
  const text = await generateGeminiText({
    model: getGeminiRuleParserModel(),
    maxOutputTokens: 420,
    responseSchema: geminiRuleParserSchema,
    systemInstruction: [
      "You are a deterministic structured intent parser for a Web3 automation platform.",
      "Return JSON only. No markdown, no commentary.",
      "Support only transfer threshold alerts, receive threshold alerts, token movement alerts, and daily wallet summaries.",
      "Reject trading, wallet execution, swaps, staking, bridging actions, arbitrary chat, and autonomous commands by returning an unsupported token_movement only if the prompt is actually token monitoring.",
      "Use normalized condition_type values: transfer_amount, receive_amount, token_movement, daily_wallet_summary.",
      "Use action_type notify except daily summaries, which use summarize.",
      "Use action.channel in-app unless the prompt names telegram, slack, email, or webhook.",
    ].join(" "),
    prompt,
  });

  return parseGeminiJson<ParsedRuleCandidate>(text);
}

function normalizePrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  if (normalized.length < 8) {
    throw new RuleParseError("Describe a wallet automation rule with a clear action and trigger.", "invalid_prompt");
  }

  if (normalized.length > 480) {
    throw new RuleParseError("Keep the automation request under 480 characters for this parser.", "invalid_prompt");
  }

  return normalized;
}

function parseWithDeterministicFallback(prompt: string): ParsedRuleCandidate {
  const normalized = prompt.toLowerCase();
  const token = inferToken(prompt);
  const threshold = inferThreshold(prompt);
  const channel = inferNotificationChannel(normalized);
  const walletScope = inferWalletScope(normalized);

  if (isDailySummaryIntent(normalized)) {
    return {
      title: `${walletScope === "All monitored wallets" ? "Daily Wallet" : walletScope} Summary`,
      description: "Create a daily operational summary for monitored wallet activity.",
      intent: "daily_summary",
      condition_type: "daily_wallet_summary",
      condition_value: null,
      token,
      action_type: "summarize",
      monitored_scope: walletScope,
      condition: { field: "daily wallet activity", operator: "summarize", value: "24h" },
      action: { channel, message: "Daily wallet summary ready" },
      walletScope,
    };
  }

  if (isReceiveIntent(normalized)) {
    return {
      title: `Large ${token ?? "Token"} Receive Alert`,
      description: `Notify operators when a monitored wallet receives ${formatThresholdForText(threshold)}${token ? ` ${token}` : ""}.`,
      intent: "receive_threshold",
      condition_type: "receive_amount",
      condition_value: threshold,
      token,
      action_type: "notify",
      monitored_scope: walletScope,
      condition: { field: "receive amount", operator: ">", value: formatConditionValue(threshold, token) },
      action: { channel, message: `Large ${token ?? "token"} receive detected` },
      walletScope,
    };
  }

  if (isTransferIntent(normalized)) {
    return {
      title: `Large ${token ?? "Token"} Transfer Alert`,
      description: `Notify operators when a monitored wallet sends more than ${formatThresholdForText(threshold)}${token ? ` ${token}` : ""}.`,
      intent: "transfer_threshold",
      condition_type: "transfer_amount",
      condition_value: threshold,
      token,
      action_type: "notify",
      monitored_scope: walletScope,
      condition: { field: "transfer amount", operator: ">", value: formatConditionValue(threshold, token) },
      action: { channel, message: `Large ${token ?? "token"} transfer detected` },
      walletScope,
    };
  }

  if (isTokenMovementIntent(normalized)) {
    return {
      title: `${token ?? "Token"} Movement Monitor`,
      description: "Track movement of the selected token across monitored wallets.",
      intent: "token_movement",
      condition_type: "token_movement",
      condition_value: threshold,
      token,
      action_type: "notify",
      monitored_scope: walletScope,
      condition: { field: "token movement", operator: threshold ? ">" : "exists", value: threshold ? formatConditionValue(threshold, token) : token ?? "any token" },
      action: { channel, message: `${token ?? "Token"} movement detected` },
      walletScope,
    };
  }

  throw new RuleParseError(
    "This parser supports transfer alerts, receive alerts, token movement tracking, and daily wallet summaries.",
    "unsupported_intent",
  );
}

function validateParsedRule(candidate: ParsedRuleCandidate): ParsedAutomationRule {
  if (!candidate.title || !candidate.description || !candidate.monitored_scope) {
    throw new RuleParseError("Parsed rule is missing required display fields.", "malformed_rule");
  }

  if (!supportedConditions.includes(candidate.condition_type)) {
    throw new RuleParseError("Parsed rule returned an unsupported condition type.", "malformed_rule");
  }

  if (!supportedActions.includes(candidate.action_type)) {
    throw new RuleParseError("Parsed rule returned an unsupported action type.", "malformed_rule");
  }

  if (!isSupportedIntentForCondition(candidate.intent, candidate.condition_type)) {
    throw new RuleParseError("Parsed rule returned an inconsistent intent and condition type.", "malformed_rule");
  }

  if (candidate.condition_type !== "daily_wallet_summary" && candidate.condition_value !== null && candidate.condition_value <= 0) {
    throw new RuleParseError("Threshold-based rules must use a positive numeric value.", "malformed_rule");
  }

  if ((candidate.condition_type === "transfer_amount" || candidate.condition_type === "receive_amount") && candidate.condition_value === null) {
    throw new RuleParseError("Transfer and receive alerts need a numeric threshold such as 1000 USDT.", "invalid_prompt");
  }

  if (candidate.token) {
    candidate.token = candidate.token.toUpperCase();
  }

  return candidate;
}

function isSupportedIntentForCondition(
  intent: ParsedRuleIntent,
  conditionType: SupportedConditionType,
) {
  return (
    (intent === "transfer_threshold" && conditionType === "transfer_amount") ||
    (intent === "receive_threshold" && conditionType === "receive_amount") ||
    (intent === "token_movement" && conditionType === "token_movement") ||
    (intent === "daily_summary" && conditionType === "daily_wallet_summary")
  );
}

function isTransferIntent(normalized: string) {
  return /\b(send|sends|sent|transfer|transfers|outflow|outgoing)\b/.test(normalized);
}

function isReceiveIntent(normalized: string) {
  return /\b(receive|receives|received|deposit|deposits|inflow|incoming)\b/.test(normalized);
}

function isTokenMovementIntent(normalized: string) {
  return /\b(track|watch|monitor|movement|moves|moved|activity)\b/.test(normalized);
}

function isDailySummaryIntent(normalized: string) {
  return /\b(daily|every day|each day|24h|24 hours)\b/.test(normalized) && /\b(summary|summarize|digest|report)\b/.test(normalized);
}

function inferToken(prompt: string) {
  const upperPrompt = prompt.toUpperCase();
  const token = supportedTokens.find((supportedToken) => new RegExp(`\\b${supportedToken}\\b`).test(upperPrompt));

  if (token) return token;

  return null;
}

function inferThreshold(prompt: string) {
  const thresholdMatch = prompt.match(/(?:over|above|greater than|more than|>|at least)\s*\$?\s*([0-9][0-9,]*(?:\.\d+)?)(?:\s*[kK])?/);
  if (!thresholdMatch) return null;

  const baseValue = Number(thresholdMatch[1].replace(/,/g, ""));
  if (!Number.isFinite(baseValue)) return null;

  return /[0-9]\s*[kK]\b/.test(thresholdMatch[0]) ? baseValue * 1000 : baseValue;
}

function inferNotificationChannel(normalized: string): RuleAction["channel"] {
  if (normalized.includes("slack")) return "slack";
  if (normalized.includes("telegram")) return "telegram";
  if (normalized.includes("email")) return "email";
  if (normalized.includes("webhook")) return "webhook";
  return "in-app";
}

function inferWalletScope(normalized: string) {
  if (normalized.includes("treasury")) return "Treasury Multisig";
  if (normalized.includes("operations") || normalized.includes("payroll")) return "Operations Wallet";
  if (normalized.includes("liquidity")) return "Liquidity Strategy";
  return "All monitored wallets";
}

function formatConditionValue(threshold: number | null, token: string | null) {
  if (!threshold) return token ?? "any token";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(threshold)}${token ? ` ${token}` : ""}`;
}

function formatThresholdForText(threshold: number | null) {
  if (!threshold) return "any amount of";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(threshold);
}

function logGeminiParser(status: "attempted" | "success" | "fallback", error?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  const message = error instanceof Error ? error.message : undefined;
  console.info("[gemini-rule-parser]", { status, message });
}
