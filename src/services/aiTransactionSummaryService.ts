import type { TransactionRow, WalletRow } from "@/services/types";
import { isSuspiciousTokenLabel } from "@/services/blockchain/safety";
import {
  generateGeminiText,
  getGeminiTransactionSummaryModel,
  isGeminiConfigured,
  parseGeminiJson,
} from "@/services/geminiProviderService";

type SummaryClassification =
  | "large_transfer"
  | "outbound_transfer"
  | "inbound_transfer"
  | "token_movement"
  | "suspicious_token"
  | "contract_interaction";

interface SummaryInput {
  wallet: Pick<WalletRow, "label" | "address" | "chain">;
  transactions: TransactionRow[];
}

interface TransactionSummary {
  hash: string;
  index?: number;
  summary: string;
  classification: SummaryClassification;
}

const maxTransactionsPerRequest = 4;
const geminiSummarySchema = {
  type: "object",
  properties: {
    summaries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hash: { type: "string" },
          index: { type: "number" },
          summary: { type: "string" },
          classification: {
            type: "string",
            enum: [
              "large_transfer",
              "outbound_transfer",
              "inbound_transfer",
              "token_movement",
              "suspicious_token",
              "contract_interaction",
            ],
          },
        },
        required: ["index", "summary", "classification"],
      },
    },
  },
  required: ["summaries"],
};

export async function summarizeTransactions(input: SummaryInput) {
  if (!input.transactions.length) return [];

  if (!isGeminiConfigured()) {
    return input.transactions.map((transaction) => summarizeDeterministically(input.wallet, transaction));
  }

  const output: TransactionSummary[] = [];

  for (const transactions of chunkTransactions(input.transactions, maxTransactionsPerRequest)) {
    try {
      logGeminiSummary("attempted");
      const summaries = await summarizeWithGemini(input.wallet, transactions);
      const byIndex = new Map(
        summaries
          .filter((summary) => typeof summary.index === "number")
          .map((summary) => [summary.index as number, summary]),
      );
      logGeminiSummary("success");

      output.push(
        ...transactions.map((transaction, index) =>
          normalizeSummary(byIndex.get(index), input.wallet, transaction),
        ),
      );
    } catch (error) {
      logGeminiSummary("fallback", error);
      output.push(
        ...transactions.map((transaction) => summarizeDeterministically(input.wallet, transaction)),
      );
    }
  }

  return output;
}

async function summarizeWithGemini(
  wallet: SummaryInput["wallet"],
  transactions: TransactionRow[],
) {
  const text = await generateGeminiText({
    model: getGeminiTransactionSummaryModel(),
    maxOutputTokens: 480,
    responseSchema: geminiSummarySchema,
    systemInstruction: [
      "You classify blockchain transaction activity for an infrastructure monitoring dashboard.",
      "Return JSON only. No markdown, no commentary.",
      "Do not provide financial advice, speculation, hype, emojis, or conversational language.",
      "Each summary must be one sentence, under 110 characters, calm, operational, and human-readable.",
      "Classify using only the provided enum values.",
    ].join(" "),
    prompt: JSON.stringify({
      wallet: {
        label: wallet.label,
        address: wallet.address,
        chain: wallet.chain,
      },
      transactions: transactions.map((transaction, index) => ({
        index,
        hash: transaction.hash,
        type: transaction.type,
        token: transaction.token,
        amount: transaction.amount,
        from: transaction.from_address,
        to: transaction.to_address,
        timestamp: transaction.timestamp,
      })),
    }),
  });

  const parsed = parseGeminiJson<{ summaries?: TransactionSummary[] }>(text);

  return Array.isArray(parsed.summaries) ? parsed.summaries : [];
}

function normalizeSummary(
  summary: TransactionSummary | undefined,
  wallet: SummaryInput["wallet"],
  transaction: TransactionRow,
) {
  const fallback = summarizeDeterministically(wallet, transaction);
  if (!summary || summary.hash !== transaction.hash || isSuspiciousTokenLabel(summary.summary)) {
    return fallback;
  }

  return {
    hash: transaction.hash,
    summary: trimSentence(summary.summary, fallback.summary),
    classification: summary.classification,
  };
}

function summarizeDeterministically(
  wallet: SummaryInput["wallet"],
  transaction: TransactionRow,
): TransactionSummary {
  const direction = getDirection(wallet.address, transaction);
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(transaction.amount);
  const token = isSuspiciousTokenLabel(transaction.token) ? "unknown token" : transaction.token;

  if (isSuspiciousTokenLabel(transaction.token)) {
    return {
      hash: transaction.hash,
      classification: "suspicious_token",
      summary: "Suspicious token label detected; review before taking action.",
    };
  }

  if (transaction.type === "contract") {
    return {
      hash: transaction.hash,
      classification: "contract_interaction",
      summary: `${wallet.label} interacted with a contract on ${wallet.chain}.`,
    };
  }

  if (direction === "outbound") {
    return {
      hash: transaction.hash,
      classification: transaction.amount >= 1000 ? "large_transfer" : "outbound_transfer",
      summary: `${wallet.label} sent ${amount} ${token} on ${wallet.chain}.`,
    };
  }

  if (direction === "inbound") {
    return {
      hash: transaction.hash,
      classification: transaction.amount >= 1000 ? "large_transfer" : "inbound_transfer",
      summary: `${wallet.label} received ${amount} ${token} on ${wallet.chain}.`,
    };
  }

  return {
    hash: transaction.hash,
    classification: "token_movement",
    summary: `${amount} ${token} movement observed for ${wallet.label}.`,
  };
}

function getDirection(walletAddress: string, transaction: TransactionRow) {
  const wallet = walletAddress.toLowerCase();
  if (transaction.from_address.toLowerCase() === wallet) return "outbound";
  if (transaction.to_address.toLowerCase() === wallet) return "inbound";
  return "movement";
}

function trimSentence(value: string, fallback: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > 180) return fallback;
  return normalized;
}

function chunkTransactions(transactions: TransactionRow[], size: number) {
  const chunks: TransactionRow[][] = [];

  for (let index = 0; index < transactions.length; index += size) {
    chunks.push(transactions.slice(index, index + size));
  }

  return chunks;
}

function logGeminiSummary(status: "attempted" | "success" | "fallback", error?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  const message = error instanceof Error ? error.message : undefined;
  console.info("[gemini-transaction-summary]", { status, message });
}
