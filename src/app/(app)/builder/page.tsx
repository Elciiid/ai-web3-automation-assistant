"use client";

import { AutomationRuleCard } from "@/components/product/automation-rule-card";
import { AiCommandCenter } from "@/components/product/ai-command-center";
import { PageHeader } from "@/components/page-header";
import { automationRules } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageSearch } from "@/hooks/use-page-search";

export default function BuilderPage() {
  const pageSearch = usePageSearch();
  const visibleRules = automationRules.filter((rule) =>
    !pageSearch ||
    [rule.name, rule.description, rule.prompt, rule.walletScope, rule.condition.value, rule.action.message]
      .some((value) => String(value).toLowerCase().includes(pageSearch)),
  );

  return (
    <div>
      <PageHeader
        eyebrow="AI rule builder"
        title="Prompt, parse, preview, save"
        description="A focused version of the command-center workflow for building structured Web3 automation rules from plain language."
      />
      <section className="page-stack">
        <AiCommandCenter hero />
        <Card className="p-5">
          <Badge tone="pink">System summary</Badge>
          <h2 className="mt-4 text-lg font-semibold text-white">Structured automation drafting</h2>
          <p className="mt-2 text-sm leading-6 text-white/52">
            Gemini parses supported prompts into deterministic rule objects. Save only after reviewing the IF/THEN preview.
          </p>
          <div className="mt-4 grid gap-2">
            {["Transfer threshold alerts", "Receive threshold alerts", "Token movement tracking"].map((item) => (
              <div key={item} className="raised-row rounded-lg p-3 text-sm text-white/64">{item}</div>
            ))}
          </div>
        </Card>
      </section>
      <section className="mt-5 panel-surface rounded-lg p-4">
        <div className="sticky-panel-header">
          <h2 className="text-xl font-semibold text-white">Example outputs</h2>
          <p className="mt-1 text-sm text-white/44">
            {pageSearch ? `Filtered by "${pageSearch}".` : "Card formats saved rules use across the product."}
          </p>
        </div>
        <div className="bounded-scroll soft-scrollbar grid gap-4 xl:grid-cols-3 [--scroll-max:34rem]">
          {visibleRules.map((rule) => (
            <AutomationRuleCard key={rule.id} rule={rule} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
