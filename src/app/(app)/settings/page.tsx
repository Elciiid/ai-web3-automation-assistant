"use client";

import { Activity, AlertTriangle, Bell, KeyRound, Loader2, Play, Shield, SlidersHorizontal, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { backendApi, type DemoMonitoringRun } from "@/lib/api/backend-client";
import { emitMonitoringRunCompleted } from "@/lib/app-events";
import { formatPhilippineNotificationTime } from "@/services/format";
import { useState } from "react";

export default function SettingsPage() {
  const [demoRun, setDemoRun] = useState<DemoMonitoringRun | null>(null);
  const [runningDemo, setRunningDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  async function runDemoMonitoring() {
    setRunningDemo(true);
    setDemoError(null);

    try {
      const result = await backendApi.demo.runMonitoring();
      setDemoRun(result);
      emitMonitoringRunCompleted();
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : "Unable to run demo monitoring cycle");
    } finally {
      setRunningDemo(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Workspace controls"
        description="Workspace configuration, notification channels, monitored chains, and controlled demo operations."
      />
      <div className="bento-grid items-start lg:grid-cols-[0.74fr_1.26fr]">
        <Card className="self-start p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-sm font-bold text-black">
              AW
            </div>
            <div>
              <h2 className="text-xl font-semibold">Aperture Workspace</h2>
              <p className="text-sm text-white/46">operator@aperture.xyz</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <Input defaultValue="Aperture Labs" />
            <Input defaultValue="operator@aperture.xyz" />
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <SettingsPanel icon={Bell} title="Notification channels" items={["In-app alerts", "Slack workspace", "Telegram bot", "Email digest"]} />
          <SettingsPanel icon={Shield} title="Monitored chains" items={["Ethereum", "Base", "Arbitrum", "Polygon"]} />
          <SettingsPanel icon={SlidersHorizontal} title="Risk thresholds" items={["Flag new approvals", "Watch transfers over $1,000", "Require review over $50,000"]} />
          <SettingsPanel icon={KeyRound} title="Developer access" items={["Demo API key", "Webhook signing", "Audit export"]} />
        </div>
      </div>
      <Card className="bento-panel mt-5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-fuchsia-100" />
              <h2 className="text-xl font-semibold">Demo monitoring cycle</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Runs only the signed-in user&apos;s monitored wallets. It uses Alchemy and Gemini quota, then stores new
              transactions, AI summaries, automation matches, and in-app notifications as real backend records.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-300/16 bg-yellow-300/[0.055] px-3 py-2 text-xs leading-5 text-yellow-100/82">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Safe for controlled demos, but avoid repeated runs when you are not actively testing provider behavior.</span>
            </div>
          </div>
          <Button onClick={() => void runDemoMonitoring()} disabled={runningDemo}>
            {runningDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {runningDemo ? "Running" : "Run cycle"}
          </Button>
        </div>

        {demoError ? (
          <div className="mt-4 rounded-lg border border-red-300/18 bg-red-300/8 px-4 py-3 text-sm text-red-100">
            {demoError}
          </div>
        ) : null}

        {demoRun ? (
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <DemoMetric label="Wallets refreshed" value={`${demoRun.refreshedWallets}/${demoRun.scannedWallets}`} />
            <DemoMetric label="Transactions inserted" value={String(demoRun.insertedTransactions)} />
            <DemoMetric label="Notifications created" value={String(demoRun.automationNotifications)} />
            <DemoMetric label="Completed" value={formatPhilippineNotificationTime(demoRun.finishedAt)} />
            <div className="raised-row rounded-lg p-4 md:col-span-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={demoRun.failedWallets ? "yellow" : "green"}>
                  {demoRun.failedWallets ? `${demoRun.failedWallets} failed` : "Completed"}
                </Badge>
                <Badge tone={demoRun.telegramEnabled ? "green" : "blue"}>
                  Telegram {demoRun.telegramEnabled ? "enabled" : "disabled"}
                </Badge>
                <span className="text-xs text-white/42">
                  {demoRun.skippedWallets} skipped / signed-in user only / {demoRun.mode}
                </span>
              </div>
              <div className="bounded-scroll soft-scrollbar mt-4 grid gap-2 md:grid-cols-2 [--scroll-max:18rem]">
                {demoRun.results.slice(0, 4).map((result) => (
                  <div key={result.walletId} className="glass-subtle rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">{result.label}</p>
                      <Badge tone={result.status === "failed" ? "yellow" : result.status === "skipped" ? "blue" : "green"}>
                        {result.chain}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/46">{result.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Card>
      <Card className="mt-5 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-fuchsia-100" />
            <h2 className="text-xl font-semibold">AI assistant preferences</h2>
          </div>
          <Badge tone="pink">Mock only</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {["Explain risk in plain language", "Attach transaction context", "Prioritize active automations"].map((item) => (
            <div key={item} className="glass-subtle flex items-center justify-between gap-4 rounded-lg p-4">
              <span className="text-sm text-white/68">{item}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DemoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="raised-row rounded-lg p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SettingsPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-fuchsia-100" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        <Badge tone="green">On</Badge>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="glass-subtle flex items-center justify-between rounded-lg p-3">
            <span className="text-sm text-white/64">{item}</span>
            <Switch defaultChecked />
          </div>
        ))}
      </div>
    </Card>
  );
}
