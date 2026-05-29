import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type AppSupabaseClient = SupabaseClient<Database>;
export type WalletRow = Database["public"]["Tables"]["wallets"]["Row"];
export type AutomationRuleRow = Database["public"]["Tables"]["automation_rules"]["Row"];
export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
