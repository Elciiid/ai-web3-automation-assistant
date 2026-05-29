import { createAutomation, getAutomations } from "@/services/automationService";
import {
  getAuthenticatedContext,
  getErrorMessage,
  isAllowed,
  jsonError,
  ok,
  optionalString,
  readJson,
  requiredString,
} from "@/app/api/_utils";
import type { RuleAction, RuleStatus } from "@/types";
import type { Json } from "@/lib/supabase/database.types";

const actionTypes = ["email", "telegram", "slack", "webhook", "in-app"] as const satisfies readonly RuleAction["channel"][];
const statuses = ["active", "paused", "draft"] as const satisfies readonly RuleStatus[];

export async function GET() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  try {
    return ok(await getAutomations(supabase, user.id));
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON body");

  const title = requiredString(body, "title") ?? requiredString(body, "name");
  const rawPrompt = requiredString(body, "rawPrompt") ?? requiredString(body, "prompt");
  const conditionType = requiredString(body, "conditionType") ?? requiredString(body, "condition_type");
  const conditionValue = requiredString(body, "conditionValue") ?? requiredString(body, "condition_value");
  const actionType = requiredString(body, "actionType") ?? requiredString(body, "action_type");
  const status = optionalString(body, "status") ?? "active";

  if (!title || !rawPrompt || !conditionType || !conditionValue || !isAllowed(actionType, actionTypes) || !isAllowed(status, statuses)) {
    return jsonError("title, rawPrompt, conditionType, conditionValue, valid actionType, and valid status are required");
  }

  try {
    return ok(
      await createAutomation(supabase, user.id, {
        title,
        rawPrompt,
        conditionType,
        conditionValue,
        actionType,
        status,
        token: optionalString(body, "token"),
        walletId: optionalString(body, "walletId") ?? optionalString(body, "wallet_id"),
        parsedRuleJson: (body.parsedRuleJson ?? body.parsed_rule_json ?? {}) as Json,
      }),
      { status: 201 },
    );
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
