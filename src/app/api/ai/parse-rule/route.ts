import { getAuthenticatedContext, getErrorMessage, jsonError, ok, readJson, requiredString } from "@/app/api/_utils";
import { parseAutomationRuleIntent, RuleParseError } from "@/services/aiRuleParserService";

export async function POST(request: Request) {
  const { user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON body");

  const prompt = requiredString(body, "prompt");
  if (!prompt) return jsonError("prompt is required");

  try {
    return ok(await parseAutomationRuleIntent(prompt));
  } catch (error) {
    if (error instanceof RuleParseError) {
      const status = error.code === "unsupported_intent" ? 422 : 400;
      return jsonError(error.message, status);
    }

    return jsonError(getErrorMessage(error), 500);
  }
}
