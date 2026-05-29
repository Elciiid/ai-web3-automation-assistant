export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          address: string;
          label: string;
          chain: "Ethereum" | "Base" | "Arbitrum" | "Optimism" | "Polygon";
          native_balance: number;
          native_symbol: string;
          balance_usd: number;
          token_summary_json: Json;
          enriched_at: string | null;
          enrichment_status: "pending" | "ready" | "failed" | "skipped";
          enrichment_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          address: string;
          label: string;
          chain: "Ethereum" | "Base" | "Arbitrum" | "Optimism" | "Polygon";
          native_balance?: number;
          native_symbol?: string;
          balance_usd?: number;
          token_summary_json?: Json;
          enriched_at?: string | null;
          enrichment_status?: "pending" | "ready" | "failed" | "skipped";
          enrichment_error?: string | null;
          created_at?: string;
        };
        Update: {
          address?: string;
          label?: string;
          chain?: "Ethereum" | "Base" | "Arbitrum" | "Optimism" | "Polygon";
          native_balance?: number;
          native_symbol?: string;
          balance_usd?: number;
          token_summary_json?: Json;
          enriched_at?: string | null;
          enrichment_status?: "pending" | "ready" | "failed" | "skipped";
          enrichment_error?: string | null;
        };
        Relationships: [];
      };
      automation_rules: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string | null;
          title: string;
          raw_prompt: string;
          parsed_rule_json: Json;
          condition_type: string;
          condition_value: string;
          token: string | null;
          action_type: "email" | "telegram" | "slack" | "webhook" | "in-app";
          status: "active" | "paused" | "draft";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id?: string | null;
          title: string;
          raw_prompt: string;
          parsed_rule_json?: Json;
          condition_type: string;
          condition_value: string;
          token?: string | null;
          action_type: "email" | "telegram" | "slack" | "webhook" | "in-app";
          status?: "active" | "paused" | "draft";
          created_at?: string;
        };
        Update: {
          wallet_id?: string | null;
          title?: string;
          raw_prompt?: string;
          parsed_rule_json?: Json;
          condition_type?: string;
          condition_value?: string;
          token?: string | null;
          action_type?: "email" | "telegram" | "slack" | "webhook" | "in-app";
          status?: "active" | "paused" | "draft";
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          wallet_id: string;
          hash: string;
          type: "transfer" | "swap" | "bridge" | "approval" | "contract";
          token: string;
          amount: number;
          from_address: string;
          to_address: string;
          timestamp: string;
          ai_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          hash: string;
          type: "transfer" | "swap" | "bridge" | "approval" | "contract";
          token: string;
          amount: number;
          from_address: string;
          to_address: string;
          timestamp?: string;
          ai_summary?: string | null;
          created_at?: string;
        };
        Update: {
          ai_summary?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          automation_rule_id: string | null;
          wallet_id: string | null;
          transaction_id: string | null;
          title: string;
          message: string;
          type: "info" | "success" | "warning" | "critical";
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          automation_rule_id?: string | null;
          wallet_id?: string | null;
          transaction_id?: string | null;
          title: string;
          message: string;
          type?: "info" | "success" | "warning" | "critical";
          read?: boolean;
          created_at?: string;
        };
        Update: {
          automation_rule_id?: string | null;
          wallet_id?: string | null;
          transaction_id?: string | null;
          title?: string;
          message?: string;
          type?: "info" | "success" | "warning" | "critical";
          read?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
