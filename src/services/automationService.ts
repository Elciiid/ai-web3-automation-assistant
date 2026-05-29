import type { AutomationRule, RuleAction, RuleCondition, RuleStatus } from "@/types";
import type { Json } from "@/lib/supabase/database.types";
import type { AppSupabaseClient, AutomationRuleRow } from "@/services/types";

export interface CreateAutomationInput {
  walletId?: string | null;
  title: string;
  rawPrompt: string;
  parsedRuleJson?: Json;
  conditionType: string;
  conditionValue: string;
  token?: string | null;
  actionType: RuleAction["channel"];
  status?: RuleStatus;
}

export async function getAutomations(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapAutomation);
}

export async function createAutomation(supabase: AppSupabaseClient, userId: string, input: CreateAutomationInput) {
  const { data, error } = await supabase
    .from("automation_rules")
    .insert({
      user_id: userId,
      wallet_id: input.walletId ?? null,
      title: input.title,
      raw_prompt: input.rawPrompt,
      parsed_rule_json: input.parsedRuleJson ?? {},
      condition_type: input.conditionType,
      condition_value: input.conditionValue,
      token: input.token ?? null,
      action_type: input.actionType,
      status: input.status ?? "active",
    })
    .select()
    .single();

  if (error) throw error;
  return mapAutomation(data);
}

export async function updateAutomationStatus(
  supabase: AppSupabaseClient,
  userId: string,
  id: string,
  status: RuleStatus,
) {
  const { data, error } = await supabase
    .from("automation_rules")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return mapAutomation(data);
}

export async function updateAutomation(
  supabase: AppSupabaseClient,
  userId: string,
  id: string,
  input: Partial<CreateAutomationInput>,
) {
  const patch: DatabaseAutomationPatch = {};

  if (input.walletId !== undefined) patch.wallet_id = input.walletId;
  if (input.title) patch.title = input.title;
  if (input.rawPrompt) patch.raw_prompt = input.rawPrompt;
  if (input.parsedRuleJson !== undefined) patch.parsed_rule_json = input.parsedRuleJson;
  if (input.conditionType) patch.condition_type = input.conditionType;
  if (input.conditionValue) patch.condition_value = input.conditionValue;
  if (input.token !== undefined) patch.token = input.token;
  if (input.actionType) patch.action_type = input.actionType;
  if (input.status) patch.status = input.status;

  const { data, error } = await supabase
    .from("automation_rules")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return mapAutomation(data);
}

export async function deleteAutomation(supabase: AppSupabaseClient, userId: string, id: string) {
  const { error } = await supabase
    .from("automation_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

type DatabaseAutomationPatch = {
  wallet_id?: string | null;
  title?: string;
  raw_prompt?: string;
  parsed_rule_json?: CreateAutomationInput["parsedRuleJson"];
  condition_type?: string;
  condition_value?: string;
  token?: string | null;
  action_type?: CreateAutomationInput["actionType"];
  status?: RuleStatus;
};

function mapAutomation(row: AutomationRuleRow): AutomationRule {
  const parsed = getParsedRule(row.parsed_rule_json);
  const condition = parsed.condition ?? buildFallbackCondition(row);
  const action = parsed.action ?? { channel: row.action_type, message: `${row.title} triggered` };

  return {
    id: row.id,
    name: row.title,
    description: parsed.description ?? `Rule generated from: ${row.raw_prompt}`,
    prompt: row.raw_prompt,
    condition,
    action,
    status: row.status,
    walletScope: parsed.walletScope ?? (row.wallet_id ? "Selected wallet" : "All monitored wallets"),
    triggerCount: 0,
    lastTriggered: "Backend ready",
  };
}

function getParsedRule(value: unknown): {
  condition?: RuleCondition;
  action?: RuleAction;
  description?: string;
  walletScope?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as { condition?: RuleCondition; action?: RuleAction; description?: string };
}

function buildFallbackCondition(row: AutomationRuleRow): RuleCondition {
  return {
    field: row.condition_type,
    operator: ">",
    value: row.token ? `${row.condition_value} ${row.token}` : row.condition_value,
  };
}
