import { deleteAutomation, updateAutomation, updateAutomationStatus } from "@/services/automationService";
import { getAuthenticatedContext, getErrorMessage, isAllowed, jsonError, ok, optionalString, readJson, requiredString } from "@/app/api/_utils";
import type { RuleAction, RuleStatus } from "@/types";
import type { Json } from "@/lib/supabase/database.types";

const statuses = ["active", "paused", "draft"] as const satisfies readonly RuleStatus[];
const actionTypes = ["email", "telegram", "slack", "webhook", "in-app"] as const satisfies readonly RuleAction["channel"][];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const body = await readJson(request);
  if (!body) return jsonError("Invalid JSON body");

  const status = requiredString(body, "status");
  if (!isAllowed(status, statuses)) return jsonError("valid status is required");

  const { id } = await params;

  try {
    const hasEditableFields = Boolean(
      body.title ||
      body.name ||
      body.rawPrompt ||
      body.prompt ||
      body.conditionType ||
      body.condition_type ||
      body.conditionValue ||
      body.condition_value ||
      body.actionType ||
      body.action_type ||
      body.parsedRuleJson ||
      body.parsed_rule_json,
    );

    if (hasEditableFields) {
      const actionType = optionalString(body, "actionType") ?? optionalString(body, "action_type");
      if (actionType && !isAllowed(actionType, actionTypes)) return jsonError("valid actionType is required");
      const safeActionType = actionType ? (actionType as RuleAction["channel"]) : undefined;

      return ok(await updateAutomation(supabase, user.id, id, {
        title: optionalString(body, "title") ?? optionalString(body, "name") ?? undefined,
        rawPrompt: optionalString(body, "rawPrompt") ?? optionalString(body, "prompt") ?? undefined,
        conditionType: optionalString(body, "conditionType") ?? optionalString(body, "condition_type") ?? undefined,
        conditionValue: optionalString(body, "conditionValue") ?? optionalString(body, "condition_value") ?? undefined,
        actionType: safeActionType,
        status,
        token: optionalString(body, "token"),
        walletId: optionalString(body, "walletId") ?? optionalString(body, "wallet_id"),
        parsedRuleJson: (body.parsedRuleJson ?? body.parsed_rule_json) as Json | undefined,
      }));
    }

    return ok(await updateAutomationStatus(supabase, user.id, id, status));
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) return jsonError("Authentication required", 401);

  const { id } = await params;

  try {
    await deleteAutomation(supabase, user.id, id);
    return ok({ id });
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
