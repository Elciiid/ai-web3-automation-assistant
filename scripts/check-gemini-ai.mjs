import { readFileSync } from "node:fs";

const env = readEnvFile(".env.local");
const apiKey = env.GEMINI_API_KEY;
const ruleModel = env.GEMINI_RULE_PARSER_MODEL || "gemini-2.5-flash-lite";
const summaryModel = env.GEMINI_TRANSACTION_SUMMARY_MODEL || "gemini-2.5-flash-lite";

if (!apiKey) {
  console.error("GEMINI_API_KEY is not configured.");
  process.exit(1);
}

const ruleSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    condition_type: { type: "string", enum: ["transfer_amount", "receive_amount", "token_movement", "daily_wallet_summary"] },
    condition_value: { type: "number" },
    token: { type: "string" },
    action_type: { type: "string", enum: ["notify", "summarize"] },
  },
  required: ["title", "condition_type", "condition_value", "token", "action_type"],
};

const summarySchema = {
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
            enum: ["large_transfer", "outbound_transfer", "inbound_transfer", "token_movement", "suspicious_token", "contract_interaction"],
          },
        },
        required: ["index", "summary", "classification"],
      },
    },
  },
  required: ["summaries"],
};

const ruleText = await generateGeminiText({
  apiKey,
  model: ruleModel,
  systemInstruction: "Return JSON only. Parse a Web3 automation rule into the provided schema.",
  prompt: "Notify me when wallet sends over 1000 USDT",
  responseSchema: ruleSchema,
  maxOutputTokens: 420,
});

const summaryText = await generateGeminiText({
  apiKey,
  model: summaryModel,
  systemInstruction: "Return JSON only. Summaries must be concise operational blockchain monitoring text.",
  prompt: JSON.stringify({
    wallet: { label: "Treasury Wallet", chain: "Ethereum" },
    transactions: [{
      index: 0,
      hash: "0xabc123",
      type: "transfer",
      token: "USDC",
      amount: 12500,
      from: "0xwallet",
      to: "0xvendor",
    }],
  }),
  responseSchema: summarySchema,
  maxOutputTokens: 360,
});

const rule = parseJsonObject(ruleText);
const summary = parseJsonObject(summaryText);

console.log(JSON.stringify({
  ruleModel,
  summaryModel,
  parse: {
    title: rule.title,
    condition_type: rule.condition_type,
    condition_value: rule.condition_value,
    token: rule.token,
    action_type: rule.action_type,
  },
  summary: summary.summaries?.[0],
}, null, 2));

async function generateGeminiText({
  apiKey,
  model,
  systemInstruction,
  prompt,
  responseSchema,
  maxOutputTokens,
}) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [{
        role: "user",
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gemini failed with ${response.status}`);
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

function readEnvFile(path) {
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.replace(/^\uFEFF/, ""))
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(`No JSON object found in Gemini output: ${text.slice(0, 80)}`);
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}
