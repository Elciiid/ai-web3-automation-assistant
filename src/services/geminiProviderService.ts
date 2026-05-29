type GeminiTextOptions = {
  model: string;
  systemInstruction: string;
  prompt: string;
  maxOutputTokens: number;
  responseSchema?: Record<string, unknown>;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
};

const geminiApiBase = "https://generativelanguage.googleapis.com/v1beta";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiText(options: GeminiTextOptions) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(
    `${geminiApiBase}/models/${encodeURIComponent(options.model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: options.systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: options.prompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: options.maxOutputTokens,
          ...(options.responseSchema
            ? {
                responseMimeType: "application/json",
                responseSchema: options.responseSchema,
              }
            : {}),
        },
      }),
    },
  );

  const payload = (await response.json()) as GeminiGenerateContentResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Gemini request failed with ${response.status}`);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned no text output");
  }

  return text;
}

export function parseGeminiJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Gemini output did not contain JSON");
    }

    return JSON.parse(text.slice(start, end + 1)) as T;
  }
}

export function getGeminiRuleParserModel() {
  return process.env.GEMINI_RULE_PARSER_MODEL ?? "gemini-2.5-flash-lite";
}

export function getGeminiTransactionSummaryModel() {
  return process.env.GEMINI_TRANSACTION_SUMMARY_MODEL ?? "gemini-2.5-flash-lite";
}
