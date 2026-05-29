import {
  Activity,
  BellRing,
  Bot,
  CircleDollarSign,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type {
  AiInsight,
  AutomationRule,
  DashboardMetric,
  NotificationEvent,
  Transaction,
  Wallet,
} from "@/types";

export const wallets: Wallet[] = [
  {
    id: "w1",
    name: "Treasury Multisig",
    address: "0x7A8f3A1b92D8fC010aA7109f2E3a3F0A88a912EF",
    chain: "Ethereum",
    balanceUsd: 4820440,
    change24h: 4.8,
    risk: "low",
    lastSeen: "2 min ago",
    tags: ["Treasury", "Core"],
  },
  {
    id: "w2",
    name: "Operations Wallet",
    address: "0x91D20eC442d3B21e9047464B94B80f4272e8C2a9",
    chain: "Base",
    balanceUsd: 684210,
    change24h: -1.2,
    risk: "medium",
    lastSeen: "14 min ago",
    tags: ["Payroll", "Gas"],
  },
  {
    id: "w3",
    name: "Liquidity Strategy",
    address: "0x0bE22736B5F4B877d0b5d90C82D44e1EaC9f55A7",
    chain: "Arbitrum",
    balanceUsd: 1298800,
    change24h: 8.1,
    risk: "low",
    lastSeen: "38 min ago",
    tags: ["LP", "Yield"],
  },
];

export const transactions: Transaction[] = [
  {
    id: "tx1",
    hash: "0x3f481b1e2c49f8d4a7a00d9e5d36a6ac24b899a0197c3f0f5584316e52f4a934",
    walletId: "w1",
    type: "transfer",
    asset: "USDT",
    amount: 1240,
    valueUsd: 1240,
    counterparty: "0x8bd2...49a1",
    chain: "Ethereum",
    status: "confirmed",
    time: "4 min ago",
    explanation:
      "Treasury sent 1,240 USDT to a previously seen vendor wallet. The amount matches the recurring monthly services pattern.",
  },
  {
    id: "tx2",
    hash: "0xa91021d01d04bc65b5b8710c27fe006d1569ec76336544d12d4b20fd0884cf71",
    walletId: "w2",
    type: "approval",
    asset: "USDC",
    amount: 50000,
    valueUsd: 50000,
    counterparty: "New contract",
    chain: "Base",
    status: "flagged",
    time: "11 min ago",
    explanation:
      "Operations approved a new spender for 50,000 USDC. The contract has limited history, so review allowance before further activity.",
  },
  {
    id: "tx3",
    hash: "0x551098ffb1924f4314fcdeea58b690a901a79f0e0f660c02cc7a2dbd2f51c018",
    walletId: "w3",
    type: "bridge",
    asset: "ETH",
    amount: 18.4,
    valueUsd: 62560,
    counterparty: "Canonical bridge",
    chain: "Arbitrum",
    status: "pending",
    time: "21 min ago",
    explanation:
      "Liquidity wallet bridged ETH to Arbitrum to rebalance LP exposure. Gas and bridge route are consistent with prior behavior.",
  },
  {
    id: "tx4",
    hash: "0x1e348ec8c6d23d151d80ea7237af55e82d3e0cd31cc9ce371062770a19910222",
    walletId: "w1",
    type: "swap",
    asset: "WETH",
    amount: 9.2,
    valueUsd: 31280,
    counterparty: "DEX aggregator",
    chain: "Ethereum",
    status: "confirmed",
    time: "44 min ago",
    explanation:
      "A WETH swap executed through a known aggregator. Slippage was below configured tolerance and route quality was strong.",
  },
];

export const automationRules: AutomationRule[] = [
  {
    id: "r1",
    name: "Large Stablecoin Transfer",
    description: "Notify when a monitored wallet sends more than 1,000 USDT or USDC.",
    prompt: "If transfer is greater than 1000 USDT or USDC, notify me immediately.",
    condition: { field: "transfer", operator: ">", value: "1000 USDT" },
    action: { channel: "in-app", message: "Large stablecoin transfer detected" },
    status: "active",
    walletScope: "All wallets",
    triggerCount: 18,
    lastTriggered: "4 min ago",
  },
  {
    id: "r2",
    name: "Unknown Approval Review",
    description: "Flag new token approvals to contracts with limited history.",
    prompt: "When any wallet approves a new contract, mark it for review.",
    condition: { field: "approval counterparty", operator: "is", value: "new contract" },
    action: { channel: "telegram", message: "New spender approval needs review" },
    status: "active",
    walletScope: "Operations Wallet",
    triggerCount: 7,
    lastTriggered: "11 min ago",
  },
  {
    id: "r3",
    name: "Bridge Completion Watch",
    description: "Watch bridge transfers above $50k and notify after settlement.",
    prompt: "Tell me when bridge activity over 50000 dollars completes.",
    condition: { field: "bridge value", operator: ">", value: "$50,000" },
    action: { channel: "slack", message: "Bridge transfer completed" },
    status: "paused",
    walletScope: "Liquidity Strategy",
    triggerCount: 4,
    lastTriggered: "2 days ago",
  },
];

export const notifications: NotificationEvent[] = [
  {
    id: "n1",
    title: "Large transfer rule triggered",
    description: "Treasury Multisig sent 1,240 USDT to 0x8bd2...49a1.",
    severity: "success",
    time: "4 min ago",
    source: "Large Stablecoin Transfer",
  },
  {
    id: "n2",
    title: "Approval needs review",
    description: "Operations Wallet approved a new Base contract for 50,000 USDC.",
    severity: "warning",
    time: "11 min ago",
    source: "Unknown Approval Review",
  },
  {
    id: "n3",
    title: "AI summary ready",
    description: "The last 24 hours of Treasury activity has been summarized.",
    severity: "info",
    time: "31 min ago",
    source: "AI Insights",
  },
];

export const aiInsights: AiInsight[] = [
  {
    id: "i1",
    title: "Normal treasury cadence",
    summary:
      "Transfers are aligned with the last three weekly settlement cycles. No unusual destinations were detected.",
    confidence: 94,
    tone: "calm",
  },
  {
    id: "i2",
    title: "Approval exposure increased",
    summary:
      "A new Base contract approval expanded USDC allowance. Review contract provenance before allowing automated follow-up actions.",
    confidence: 87,
    tone: "watch",
  },
  {
    id: "i3",
    title: "Liquidity rebalance in progress",
    summary:
      "Bridge and swap activity suggests planned LP rebalancing rather than treasury outflow risk.",
    confidence: 91,
    tone: "calm",
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Monitored value", value: "$6.8M", delta: "+5.4% today", tone: "positive", icon: CircleDollarSign },
  { label: "Active automations", value: "24", delta: "3 triggered today", tone: "neutral", icon: Zap },
  { label: "AI explanations", value: "148", delta: "21 this week", tone: "positive", icon: Bot },
  { label: "Risk events", value: "2", delta: "1 needs review", tone: "warning", icon: ShieldCheck },
];

export const landingFeatures = [
  {
    icon: Activity,
    title: "Wallet monitoring that reads like an analyst",
    description: "Track treasury, operations, LP, and whale wallets with contextual explanations instead of raw hashes.",
  },
  {
    icon: Bot,
    title: "Natural language automation",
    description: "Describe a rule in plain English and preview the structured trigger before activating it.",
  },
  {
    icon: BellRing,
    title: "Signal-first notifications",
    description: "Get alerts with severity, source, wallet context, and AI reasoning so teams can act quickly.",
  },
];
