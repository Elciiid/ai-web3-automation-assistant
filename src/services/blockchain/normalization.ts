import type { Chain, Transaction } from "@/types";
import type { BlockchainTransfer } from "@/services/blockchain/types";
import { isSuspiciousTokenLabel } from "@/services/blockchain/safety";

type AlchemyTransferCategory = "external" | "erc20" | "internal";

export const chainConfig: Partial<Record<Chain, {
  alchemyNetwork: string;
  nativeSymbol: string;
  transferCategories: AlchemyTransferCategory[];
}>> = {
  Ethereum: {
    alchemyNetwork: "eth-mainnet",
    nativeSymbol: "ETH",
    transferCategories: ["external", "erc20", "internal"],
  },
  Base: {
    alchemyNetwork: "base-mainnet",
    nativeSymbol: "ETH",
    transferCategories: ["external", "erc20", "internal"],
  },
  Arbitrum: {
    alchemyNetwork: "arb-mainnet",
    nativeSymbol: "ETH",
    transferCategories: ["external", "erc20"],
  },
  Polygon: {
    alchemyNetwork: "polygon-mainnet",
    nativeSymbol: "MATIC",
    transferCategories: ["external", "erc20", "internal"],
  },
};

export interface AlchemyTransfer {
  hash?: string;
  category?: string;
  asset?: string | null;
  value?: number | string | null;
  from?: string | null;
  to?: string | null;
  metadata?: {
    blockTimestamp?: string;
  };
}

export function formatUnits(value: bigint, decimals: number) {
  if (decimals <= 0) return Number(value);

  const divisor = BigInt(10) ** BigInt(decimals);
  const integer = value / divisor;
  const fraction = value % divisor;
  const fractionText = fraction.toString().padStart(decimals, "0").slice(0, 6).replace(/0+$/, "");

  return Number(`${integer.toString()}${fractionText ? `.${fractionText}` : ""}`);
}

export function hexToNumber(value: string | null | undefined, decimals = 18) {
  if (!value || value === "0x") return 0;
  return formatUnits(BigInt(value), decimals);
}

export function normalizeAlchemyTransfer(transfer: AlchemyTransfer, nativeSymbol: string): BlockchainTransfer | null {
  if (!transfer.hash) return null;

  const token = transfer.asset ?? nativeSymbol;
  if (isSuspiciousTokenLabel(token)) return null;

  return {
    hash: transfer.hash,
    type: normalizeTransactionType(transfer.category),
    token,
    amount: Number(transfer.value ?? 0),
    fromAddress: transfer.from ?? "",
    toAddress: transfer.to ?? "",
    timestamp: transfer.metadata?.blockTimestamp ?? new Date().toISOString(),
  };
}

function normalizeTransactionType(category: string | undefined): Transaction["type"] {
  if (category === "erc20" || category === "external") return "transfer";
  if (category === "internal") return "contract";
  return "transfer";
}
