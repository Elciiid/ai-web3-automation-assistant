import type { Chain } from "@/types";
import { chainConfig, hexToNumber, normalizeAlchemyTransfer, type AlchemyTransfer } from "@/services/blockchain/normalization";
import { isSuspiciousTokenLabel } from "@/services/blockchain/safety";
import type { BlockchainTokenBalance, WalletEnrichmentSnapshot } from "@/services/blockchain/types";

interface JsonRpcResult<T> {
  result?: T;
  error?: {
    message?: string;
  };
}

interface TokenBalanceResult {
  tokenBalances?: Array<{
    contractAddress: string;
    tokenBalance: string | null;
  }>;
}

interface TokenMetadataResult {
  name?: string | null;
  symbol?: string | null;
  decimals?: number | null;
}

interface AssetTransfersResult {
  transfers?: AlchemyTransfer[];
}

interface PriceResult {
  data?: Array<{
    symbol: string;
    prices?: Array<{
      currency: string;
      value: string;
    }>;
  }>;
}

export async function fetchAlchemyWalletSnapshot(address: string, chain: Chain): Promise<WalletEnrichmentSnapshot> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("ALCHEMY_API_KEY is not configured");
  }

  const config = chainConfig[chain];
  if (!config) {
    throw new Error(`${chain} enrichment is not configured for this Alchemy app`);
  }

  const rpcUrl = `https://${config.alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;

  const [nativeBalanceHex, tokenBalances, inboundTransfers, outboundTransfers, nativePriceUsd] = await Promise.all([
    callAlchemyRpc<string>(rpcUrl, "eth_getBalance", [address, "latest"]),
    callAlchemyRpc<TokenBalanceResult>(rpcUrl, "alchemy_getTokenBalances", [address, "erc20"]),
    callAlchemyRpc<AssetTransfersResult>(rpcUrl, "alchemy_getAssetTransfers", [
      {
        fromBlock: "0x0",
        toBlock: "latest",
        toAddress: address,
        category: config.transferCategories,
        withMetadata: true,
        excludeZeroValue: true,
        maxCount: "0xa",
        order: "desc",
      },
    ]),
    callAlchemyRpc<AssetTransfersResult>(rpcUrl, "alchemy_getAssetTransfers", [
      {
        fromBlock: "0x0",
        toBlock: "latest",
        fromAddress: address,
        category: config.transferCategories,
        withMetadata: true,
        excludeZeroValue: true,
        maxCount: "0xa",
        order: "desc",
      },
    ]),
    fetchNativePriceUsd(apiKey, config.nativeSymbol),
  ]);

  const nativeBalance = hexToNumber(nativeBalanceHex, 18);
  const tokens = await fetchTokenSummaries(rpcUrl, tokenBalances.tokenBalances ?? []);
  const transfers = [...(inboundTransfers.transfers ?? []), ...(outboundTransfers.transfers ?? [])]
    .map((transfer) => normalizeAlchemyTransfer(transfer, config.nativeSymbol))
    .filter((transfer): transfer is NonNullable<typeof transfer> => Boolean(transfer))
    .filter(dedupeByHash)
    .slice(0, 12);

  return {
    address,
    chain,
    nativeSymbol: config.nativeSymbol,
    nativeBalance,
    nativePriceUsd,
    balanceUsd: nativeBalance * nativePriceUsd,
    tokens,
    transfers,
  };
}

async function callAlchemyRpc<T>(url: string, method: string, params: unknown[]) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Alchemy ${method} request failed with ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResult<T>;
  if (payload.error) {
    throw new Error(payload.error.message ?? `Alchemy ${method} request failed`);
  }

  if (payload.result === undefined) {
    throw new Error(`Alchemy ${method} returned no result`);
  }

  return payload.result;
}

async function fetchTokenSummaries(
  rpcUrl: string,
  balances: Array<{ contractAddress: string; tokenBalance: string | null }>,
) {
  const nonZeroBalances = balances
    .filter((token) => token.tokenBalance && token.tokenBalance !== "0x0")
    .slice(0, 5);

  const tokens = await Promise.all(
    nonZeroBalances.map(async (token): Promise<BlockchainTokenBalance | null> => {
      try {
        const metadata = await callAlchemyRpc<TokenMetadataResult>(rpcUrl, "alchemy_getTokenMetadata", [token.contractAddress]);
        const decimals = metadata.decimals ?? 18;
        if (isSuspiciousTokenLabel(metadata.symbol) || isSuspiciousTokenLabel(metadata.name)) {
          return null;
        }

        return {
          contractAddress: token.contractAddress,
          name: metadata.name ?? "Unknown token",
          symbol: metadata.symbol ?? "TOKEN",
          decimals,
          balance: hexToNumber(token.tokenBalance, decimals),
        };
      } catch {
        return null;
      }
    }),
  );

  return tokens.filter((token): token is BlockchainTokenBalance => Boolean(token));
}

async function fetchNativePriceUsd(apiKey: string, symbol: string) {
  const response = await fetch(`https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-symbol?symbols=${encodeURIComponent(symbol)}`, {
    cache: "no-store",
  });

  if (!response.ok) return 0;

  const payload = (await response.json()) as PriceResult;
  const usdPrice = payload.data
    ?.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase())
    ?.prices?.find((price) => price.currency.toUpperCase() === "USD")
    ?.value;

  return usdPrice ? Number(usdPrice) : 0;
}

function dedupeByHash<T extends { hash: string }>(transfer: T, index: number, transfers: T[]) {
  return transfers.findIndex((candidate) => candidate.hash === transfer.hash) === index;
}
