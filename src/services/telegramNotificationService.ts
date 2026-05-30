import { formatTelegramDigest, type TelegramDigestMatch } from "@/services/telegramDigestFormatter";
import type { WalletRow } from "@/services/types";

type TelegramDigestInput = {
  wallet: Pick<WalletRow, "label" | "address" | "chain">;
  matches: TelegramDigestMatch[];
  notificationCreatedAt: string;
};

type TelegramDeliveryResult =
  | { delivered: true }
  | { delivered: false; reason: string };

type TelegramDeliveryOptions = {
  force?: boolean;
};

type TelegramSendResponse = {
  ok?: boolean;
  result?: {
    message_id?: number;
  };
  description?: string;
  parameters?: {
    retry_after?: number;
  };
};

const telegramApiBase = "https://api.telegram.org";

export async function sendTelegramAutomationDigest(
  input: TelegramDigestInput,
  options: TelegramDeliveryOptions = {},
): Promise<TelegramDeliveryResult> {
  if (!input.matches.length) {
    return { delivered: false, reason: "empty_digest" };
  }

  if (!options.force && !isTelegramEnabled()) {
    logTelegram("skipped", input, "Telegram delivery is disabled");
    return { delivered: false, reason: "disabled" };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    logTelegram("skipped", input, "Telegram credentials are not configured");
    return { delivered: false, reason: "missing_credentials" };
  }

  try {
    const payload = await sendTelegramMessage(botToken, chatId, formatTelegramDigest(input));

    logTelegram("delivered", input, `message_id=${payload.result?.message_id ?? "unknown"}`);
    return { delivered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram delivery failed";
    logTelegram("failed", input, message);
    return { delivered: false, reason: message };
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const firstAttempt = await postTelegramMessage(botToken, chatId, text);
  if (firstAttempt.response.ok) return firstAttempt.payload;

  const retryAfter = firstAttempt.payload.parameters?.retry_after;
  if (firstAttempt.response.status === 429 && retryAfter && retryAfter <= 15) {
    await sleep((retryAfter + 1) * 1000);
    const secondAttempt = await postTelegramMessage(botToken, chatId, text);
    if (secondAttempt.response.ok) return secondAttempt.payload;

    throw new Error(
      secondAttempt.payload.description ?? `Telegram sendMessage failed with ${secondAttempt.response.status}`,
    );
  }

  throw new Error(firstAttempt.payload.description ?? `Telegram sendMessage failed with ${firstAttempt.response.status}`);
}

async function postTelegramMessage(botToken: string, chatId: string, text: string) {
  const response = await fetch(`${telegramApiBase}/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const payload = (await response.json()) as TelegramSendResponse;

  return { response, payload };
}

function isTelegramEnabled() {
  return process.env.ENABLE_TELEGRAM_NOTIFICATIONS === "true";
}

function logTelegram(
  status: "delivered" | "failed" | "skipped",
  input: TelegramDigestInput,
  reason?: string,
) {
  const payload = {
    status,
    wallet: input.wallet.label,
    chain: input.wallet.chain,
    signals: input.matches.length,
    reason,
  };

  const log = status === "failed" ? console.warn : console.info;
  log("[telegram-notification]", payload);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
