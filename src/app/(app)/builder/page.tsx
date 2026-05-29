import { AutomationRuleCard } from "@/components/product/automation-rule-card";
import { AiCommandCenter } from "@/components/product/ai-command-center";
import { PageHeader } from "@/components/page-header";
import { automationRules } from "@/lib/mock-data";

export default function BuilderPage() {
  return (
    <div>
      <PageHeader
        eyebrow="AI rule builder"
        title="Prompt, parse, preview, save"
        description="A focused version of the command-center workflow for building structured Web3 automation rules from plain language."
      />
      <AiCommandCenter hero />
      <section className="mt-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">Example outputs</h2>
          <p className="mt-1 text-sm text-white/44">These show the card format saved rules use across the product.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {automationRules.map((rule) => (
            <AutomationRuleCard key={rule.id} rule={rule} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
