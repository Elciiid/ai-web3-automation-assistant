import Link from "next/link";
import { ArrowRight, BellRing, Bot, Send, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { AiCommandCard } from "@/components/ai-command-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowPreview } from "@/components/workflow-preview";
import { dashboardMetrics, landingFeatures, notifications, transactions } from "@/lib/mock-data";

export default function LandingPage() {
  return (
    <main className="app-radial-bg min-h-screen overflow-hidden text-white">
      <div className="noise-overlay" />
      <div className="relative z-10">
      <header className="relative mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-black">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">AI Web3 Automation Assistant</span>
        </Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-sm text-white/58 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#workflow" className="hover:text-white">Workflow</a>
          <a href="#preview" className="hover:text-white">Preview</a>
        </nav>
        <Button asChild variant="secondary" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge tone="pink">AI command center for on-chain operations</Badge>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.04] text-white sm:text-7xl">
            Monitor wallets and automate Web3 workflows with natural language.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
            A polished workspace for teams that need blockchain alerts, explainable activity, and automation rules without digging through raw transaction data.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/builder">Try AI builder</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a
                href="https://t.me/unitflowalerts"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join UnitFlow Alerts Telegram channel"
              >
                <Send className="h-4 w-4" />
                Join UnitFlow Alerts
              </a>
            </Button>
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/46">
            Follow live automation alerts from my AI Web3 monitoring project.
          </p>
        </div>

        <div id="workflow" className="mx-auto mt-12 max-w-5xl">
          <AiCommandCard />
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          {landingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-6">
                <Icon className="h-6 w-6 text-fuchsia-100" />
                <h2 className="mt-5 text-xl font-semibold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/54">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="preview" className="mx-auto grid max-w-7xl gap-5 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/46">Live operations</p>
                <h2 className="mt-1 text-2xl font-semibold">Dashboard preview</h2>
              </div>
              <Badge tone="green">Realtime mock</Badge>
            </div>
          </div>
          <div className="grid gap-px bg-white/10 md:grid-cols-4">
            {dashboardMetrics.map((metric) => (
              <div key={metric.label} className="bg-white/[0.032] p-5 backdrop-blur-xl">
                <metric.icon className="h-5 w-5 text-fuchsia-100" />
                <p className="mt-5 text-sm text-white/46">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white/72">Recent activity</h3>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="raised-row rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium capitalize">{transaction.type}</span>
                      <span className="text-xs text-white/42">{transaction.time}</span>
                    </div>
                    <p className="mt-2 text-xs text-white/50">{transaction.asset} / ${transaction.valueUsd.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white/72">Triggered alerts</h3>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="raised-row rounded-lg p-4">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/50">{notification.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <Bot className="h-6 w-6 text-fuchsia-100" />
            <h2 className="mt-5 text-2xl font-semibold">AI explanations for every important movement</h2>
            <p className="mt-4 text-sm leading-7 text-white/54">
              Each alert includes wallet context, counterparty notes, risk posture, and a plain-language explanation built for operators.
            </p>
          </Card>
          <WorkflowPreview compact />
          <Card className="grid grid-cols-3 gap-px overflow-hidden bg-white/10">
            {[
              [WalletCards, "3 wallets"],
              [BellRing, "21 alerts"],
              [ShieldCheck, "2 reviews"],
            ].map(([Icon, label]) => (
              <div key={String(label)} className="bg-white/[0.032] p-5 text-center backdrop-blur-xl">
                <Icon className="mx-auto h-5 w-5 text-emerald-200" />
                <p className="mt-3 text-sm font-semibold">{String(label)}</p>
              </div>
            ))}
          </Card>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 text-center text-sm text-white/42">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <span>Built for premium Web3 operations demos.</span>
          <a
            href="https://t.me/unitflowalerts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1.5 text-white/68 transition hover:border-white/22 hover:bg-white/[0.04] hover:text-white"
            aria-label="View UnitFlow Alerts Telegram channel"
          >
            <Send className="h-3.5 w-3.5" />
            View Telegram Alerts
          </a>
        </div>
      </footer>
      </div>
    </main>
  );
}
