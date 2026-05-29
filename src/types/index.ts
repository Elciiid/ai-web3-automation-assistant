import type { LucideIcon } from "lucide-react";

export type Chain = "Ethereum" | "Base" | "Arbitrum" | "Optimism" | "Polygon";

export type TransactionStatus = "confirmed" | "pending" | "flagged";

export type RuleStatus = "active" | "paused" | "draft";

export interface Wallet {
  id: string;
  name: string;
  address: string;
  chain: Chain;
  balanceUsd: number;
  change24h: number;
  risk: "low" | "medium" | "high";
  lastSeen: string;
  tags: string[];
}

export interface Transaction {
  id: string;
  hash: string;
  walletId: string;
  type: "transfer" | "swap" | "bridge" | "approval" | "contract";
  asset: string;
  amount: number;
  valueUsd: number;
  counterparty: string;
  chain: Chain;
  status: TransactionStatus;
  time: string;
  explanation: string;
}

export interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

export interface RuleAction {
  channel: "email" | "telegram" | "slack" | "webhook" | "in-app";
  message: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  prompt: string;
  condition: RuleCondition;
  action: RuleAction;
  status: RuleStatus;
  walletScope: string;
  triggerCount: number;
  lastTriggered: string;
}

export type ParsedRuleIntent =
  | "transfer_threshold"
  | "receive_threshold"
  | "token_movement"
  | "daily_summary";

export type ParsedRuleActionType = "notify" | "summarize";

export interface ParsedAutomationRule {
  title: string;
  description: string;
  intent: ParsedRuleIntent;
  condition_type: "transfer_amount" | "receive_amount" | "token_movement" | "daily_wallet_summary";
  condition_value: number | null;
  token: string | null;
  action_type: ParsedRuleActionType;
  monitored_scope: string;
  condition: RuleCondition;
  action: RuleAction;
  walletScope: string;
}

export interface NotificationEvent {
  id: string;
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "critical";
  time: string;
  source: string;
  walletIdentity?: string;
  walletHref?: string;
  read?: boolean;
}

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "neutral" | "warning";
  icon: LucideIcon;
}

export interface AiInsight {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  tone: "calm" | "watch" | "risk";
}
