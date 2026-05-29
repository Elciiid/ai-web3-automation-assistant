"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AutomationRuleCard } from "@/components/product/automation-rule-card";
import { EmptyState } from "@/components/product/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { useAutomations } from "@/hooks/use-automations";
import type { AutomationRule } from "@/types";

type RuleDraft = Omit<AutomationRule, "id" | "triggerCount" | "lastTriggered">;

const emptyRule: RuleDraft = {
  name: "",
  description: "",
  prompt: "",
  condition: { field: "transfer", operator: ">", value: "1000 USDT" },
  action: { channel: "in-app", message: "Notify operator" },
  status: "active",
  walletScope: "All wallets",
};

export default function AutomationsPage() {
  const {
    rules,
    loading,
    error,
    saving,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  } = useAutomations();
  const [editing, setEditing] = useState<AutomationRule | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Automation layer"
        title="AI-generated action rules"
        description="Rules are modeled like Web3 actions: condition, action, wallet scope, threshold, status, and controls."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Create rule
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {[
          ["Active rules", rules.filter((rule) => rule.status === "active").length],
          ["Paused", rules.filter((rule) => rule.status === "paused").length],
          ["Total triggers", rules.reduce((sum, rule) => sum + rule.triggerCount, 0)],
          ["Review queue", 2],
        ].map(([label, value]) => (
          <div key={label} className="panel-surface rounded-lg p-4">
            <p className="text-xs text-white/38">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {error ? <InlineError message={error} /> : null}

      {loading ? (
        <AutomationSkeletons count={4} />
      ) : rules.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {rules.map((rule) => (
            <AutomationRuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => toggleRule(rule.id)}
              onEdit={() => setEditing(rule)}
              onDelete={() => deleteRule(rule.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No active rules"
          description="Create a natural-language automation and it will appear here as a structured Web3 action card."
          actionLabel="Create rule"
          onAction={() => setCreating(true)}
        />
      )}

      <RuleDialog
        open={creating}
        title="Create automation rule"
        description="This saves to your Supabase-backed automation table."
        onOpenChange={setCreating}
        saving={saving}
        onSave={async (rule) => {
          await createRule(rule);
        }}
      />

      <RuleDialog
        open={Boolean(editing)}
        title="Edit automation rule"
        description="Tune the local rule preview without touching a backend."
        rule={editing ?? undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={async (rule) => {
          if (editing) await updateRule(editing.id, rule);
          setEditing(null);
        }}
      />
    </div>
  );
}

function RuleDialog({
  rule,
  title,
  description,
  open,
  onOpenChange,
  onSave,
  saving = false,
}: {
  rule?: AutomationRule;
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: RuleDraft) => Promise<void>;
  saving?: boolean;
}) {
  const [form, setForm] = useState<RuleDraft>(emptyRule);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(
      rule
        ? {
            name: rule.name,
            description: rule.description,
            prompt: rule.prompt,
            condition: rule.condition,
            action: rule.action,
            status: rule.status,
            walletScope: rule.walletScope,
          }
        : emptyRule,
    );
  }, [rule, open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      await onSave(form);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save automation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <span className="hidden" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2">
            <Badge tone="pink">Rule editor</Badge>
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Rule name" required />
          <Textarea value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} placeholder="Natural language rule" required />
          <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short description" required />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input value={form.condition.field} onChange={(event) => setForm({ ...form, condition: { ...form.condition, field: event.target.value } })} placeholder="Field" />
            <Input value={form.condition.operator} onChange={(event) => setForm({ ...form, condition: { ...form.condition, operator: event.target.value } })} placeholder="Operator" />
            <Input value={form.condition.value} onChange={(event) => setForm({ ...form, condition: { ...form.condition, value: event.target.value } })} placeholder="Token / threshold" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={form.walletScope} onChange={(event) => setForm({ ...form, walletScope: event.target.value })} placeholder="Wallet scope" />
            <Input value={form.action.message} onChange={(event) => setForm({ ...form, action: { ...form.action, message: event.target.value } })} placeholder="Action message" />
          </div>
          {submitError ? <InlineError message={submitError} /> : null}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving || submitting}>{saving || submitting ? "Saving" : "Save rule"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AutomationSkeletons({ count }: { count: number }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="panel-surface rounded-lg p-5">
          <div className="h-4 w-32 rounded-full bg-white/[0.07]" />
          <div className="mt-5 h-5 w-2/3 rounded-full bg-white/[0.08]" />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="h-20 rounded-lg bg-white/[0.045]" />
            <div className="h-20 rounded-lg bg-white/[0.045]" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-14 rounded-lg bg-white/[0.04]" />
            <div className="h-14 rounded-lg bg-white/[0.04]" />
            <div className="h-14 rounded-lg bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-red-300/18 bg-red-300/8 px-4 py-3 text-sm text-red-100">
      {message}
    </div>
  );
}
