"use client";

import {
  Bell,
  Bot,
  CheckCircle2,
  Database,
  RadioTower,
  Send,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const checklistItems = [
  { label: "Auth connected", icon: ShieldCheck, tone: "green" as const },
  { label: "Wallet enrichment ready", icon: Wallet, tone: "green" as const },
  { label: "Gemini AI ready", icon: Bot, tone: "green" as const },
  { label: "Automation engine ready", icon: Zap, tone: "green" as const },
  { label: "In-app notifications ready", icon: Bell, tone: "green" as const },
  { label: "Telegram optional", icon: Send, tone: "blue" as const },
  { label: "Scheduler disabled by default", icon: RadioTower, tone: "yellow" as const },
];

const realityNotes = [
  "Wallet transactions are blockchain-derived through Alchemy after monitoring runs.",
  "Automations execute against newly ingested transactions and create in-app alerts.",
  "Gemini powers rule parsing and transaction summaries, with deterministic fallbacks.",
  "Telegram and scheduled monitoring stay disabled unless explicitly enabled to protect API usage.",
];

export function DemoReadinessPanel() {
  return (
    <Card className="p-5">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/8 bg-white/[0.045]">
              <Database className="h-5 w-5 text-fuchsia-100" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/36">Recruiter demo</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Operational AI Web3 monitoring</h2>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm leading-6 text-white/56">
            <p>Use the command center to create a natural-language automation rule.</p>
            <p>Run a demo monitoring cycle in Settings to ingest real wallet activity.</p>
            <p>After monitoring, transactions, AI summaries, automation matches, and notifications become real backend records.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {checklistItems.map((item) => (
            <div key={item.label} className="raised-row flex items-center gap-3 rounded-lg p-3">
              <item.icon className="h-4 w-4 text-white/54" />
              <span className="min-w-0 flex-1 truncate text-sm text-white/68">{item.label}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-200/86" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="green">Real backend</Badge>
          <Badge tone="blue">Provider-backed</Badge>
          <Badge tone="yellow">Quota-aware</Badge>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {realityNotes.map((note) => (
            <p key={note} className="text-sm leading-6 text-white/50">
              {note}
            </p>
          ))}
        </div>
      </div>
    </Card>
  );
}
