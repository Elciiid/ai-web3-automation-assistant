import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const chainConfig = {
  Ethereum: {
    network: "eth-mainnet",
    nativeSymbol: "ETH",
    transferCategories: ["external", "erc20", "internal"],
  },
  Base: {
    network: "base-mainnet",
    nativeSymbol: "ETH",
    transferCategories: ["external", "erc20", "internal"],
  },
  Arbitrum: {
    network: "arb-mainnet",
    nativeSymbol: "ETH",
    transferCategories: ["external", "erc20"],
  },
  Polygon: {
    network: "polygon-mainnet",
    nativeSymbol: "MATIC",
    transferCategories: ["external", "erc20", "internal"],
  },
};

const [, , chain, address] = process.argv;

if (!chain || !address || !chainConfig[chain]) {
  console.error("Usage: node scripts/check-alchemy-wallet.mjs <Ethereum|Base|Arbitrum|Polygon> <0xwallet>");
  process.exit(1);
}

const env = readEnvLocal();
const apiKey = env.ALCHEMY_API_KEY;
if (!apiKey) {
  console.error("ALCHEMY_API_KEY is not configured in .env.local");
  process.exit(1);
}

const config = chainConfig[chain];
const rpcUrl = `https://${config.network}.g.alchemy.com/v2/${apiKey}`;

const [balanceHex, inbound, outbound] = await Promise.all([
  rpc("eth_getBalance", [address, "latest"]),
  rpc("alchemy_getAssetTransfers", [{
    fromBlock: "0x0",
    toBlock: "latest",
    toAddress: address,
    category: config.transferCategories,
    withMetadata: true,
    excludeZeroValue: true,
    maxCount: "0x5",
    order: "desc",
  }]),
  rpc("alchemy_getAssetTransfers", [{
    fromBlock: "0x0",
    toBlock: "latest",
    fromAddress: address,
    category: config.transferCategories,
    withMetadata: true,
    excludeZeroValue: true,
    maxCount: "0x5",
    order: "desc",
  }]),
]);

const balance = Number(BigInt(balanceHex)) / 10 ** 18;
const transfers = [...(inbound.transfers ?? []), ...(outbound.transfers ?? [])];

console.log(JSON.stringify({
  chain,
  address,
  nativeSymbol: config.nativeSymbol,
  nativeBalance: balance,
  transferCount: transfers.length,
  sampleHashes: transfers.slice(0, 3).map((transfer) => transfer.hash),
}, null, 2));

async function rpc(method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  if (!response.ok) {
    throw new Error(`${method} failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message ?? `${method} failed`);
  }

  return payload.result;
}

function readEnvLocal() {
  const path = resolve(".env.local");
  const envText = readFileSync(path, "utf8");

  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}
