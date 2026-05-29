"use client";

import { Bell, Edit3, Pause, Play, Trash2, Wallet2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AutomationRule } from "@/types";

export function AutomationRuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
  compact = false,
}: {
  rule: AutomationRule;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}) {
  return (
    <Card className="group overflow-hidden">
      <div className="border-b border-white/8 bg-white/[0.026] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={rule.status} />
              <Badge tone="blue">{rule.walletScope}</Badge>
            </div>
            <h3 className="truncate text-lg font-semibold text-white">{rule.name}</h3>
            {!compact ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/52">{rule.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/64 transition hover:border-white/14 hover:bg-white/[0.058] hover:text-white disabled:pointer-events-none disabled:opacity-50"
            disabled={!onToggle}
            aria-label={rule.status === "active" ? "Pause rule" : "Activate rule"}
          >
            {rule.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <RuleLeg label="IF" value={`${rule.condition.field} ${rule.condition.operator} ${rule.condition.value}`} />
          <RuleLeg label="THEN" value={`${rule.action.channel} / ${rule.action.message}`} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetaPill icon={Wallet2} label="Wallet" value={rule.walletScope} />
          <MetaPill icon={Bell} label="Triggers" value={`${rule.triggerCount}`} />
          <MetaPill icon={Play} label="Last run" value={rule.lastTriggered} />
        </div>
        {!compact ? (
          <div className="rounded-lg border border-white/10 bg-black/26 p-4">
            <p className="text-xs font-semibold uppercase text-white/38">Source prompt</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{rule.prompt}</p>
          </div>
        ) : null}
        {(onEdit || onDelete) ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {onEdit ? (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            ) : null}
            {onDelete ? (
              <Button variant="danger" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function RuleLeg({ label, value }: { label: string; value: string }) {
  return (
    <div className="raised-row rounded-lg p-4">
      <p className="text-xs font-semibold uppercase text-fuchsia-100">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-white">{value}</p>
    </div>
  );
}

function MetaPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-subtle rounded-lg p-3">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-white/78">{value}</p>
    </div>
  );
}
