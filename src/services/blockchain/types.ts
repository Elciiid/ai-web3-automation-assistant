import type { Chain, Transaction } from "@/types";

export interface BlockchainTokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
}

export interface BlockchainTransfer {
  hash: string;
  type: Transaction["type"];
  token: string;
  amount: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
}

export interface WalletEnrichmentSnapshot {
  address: string;
  chain: Chain;
  nativeSymbol: string;
  nativeBalance: number;
  nativePriceUsd: number;
  balanceUsd: number;
  tokens: BlockchainTokenBalance[];
  transfers: BlockchainTransfer[];
}
