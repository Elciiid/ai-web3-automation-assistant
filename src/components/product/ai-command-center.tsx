"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, CheckCircle2, Loader2, Save, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { backendApi } from "@/lib/api/backend-client";
import { useAppStore } from "@/store/use-app-store";
import type { AutomationRule, ParsedAutomationRule } from "@/types";

type RuleDraft = Omit<AutomationRule, "id" | "triggerCount" | "lastTriggered">;

const examplePrompts = [
  "If transfer > 1000 USDT, notify me immediately.",
  "Notify me when a wallet receives over 5000 USDC.",
  "Send me a daily summary of treasury wallet activity.",
];

export function AiCommandCenter({
  hero = false,
  onSaved,
  onSaveAutomation,
}: {
  hero?: boolean;
  onSaved?: (rule: AutomationRule) => void;
  onSaveAutomation?: (rule: RuleDraft) => Promise<AutomationRule>;
}) {
  const addRule = useAppStore((state) => state.addRule);
  const [prompt, setPrompt] = useState(examplePrompts[0]);
  const [phase, setPhase] = useState<"idle" | "parsing" | "parsed" | "saving" | "saved" | "error">("parsing");
  const [parsedRule, setParsedRule] = useState<ParsedAutomationRule | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const parseRequestRef = useRef(0);

  const canSave = phase === "parsed" && Boolean(parsedRule);

  const parsePrompt = useCallback(async (nextPrompt: string) => {
    const requestId = parseRequestRef.current + 1;
    parseRequestRef.current = requestId;
    const trimmedPrompt = nextPrompt.trim();

    if (!trimmedPrompt) {
      setParsedRule(null);
      setParseError("Enter a rule request before parsing.");
      setPhase("error");
      return;
    }

    setPhase("parsing");
    setParseError(null);

    try {
      const rule = await backendApi.ai.parseRule(trimmedPrompt);
      if (parseRequestRef.current !== requestId) return;
      setParsedRule(rule);
      setPhase("parsed");
    } catch (error) {
      if (parseRequestRef.current !== requestId) return;
      setParsedRule(null);
      setParseError(error instanceof Error ? error.message : "Unable to parse this automation request.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    void parsePrompt(examplePrompts[0]);
  }, [parsePrompt]);

  function save() {
    if (!canSave || !parsedRule) return;

    const newRule: RuleDraft = {
      name: parsedRule.title,
      description: parsedRule.description,
      prompt,
      condition: parsedRule.condition,
      action: parsedRule.action,
      status: "active" as const,
      walletScope: parsedRule.walletScope,
    };
    setPhase("saving");
    window.setTimeout(() => {
      void (async () => {
        try {
          const createdRule = onSaveAutomation ? await onSaveAutomation(newRule) : addRule(newRule);
          setPhase("saved");
          onSaved?.(createdRule);
        } catch {
          setPhase("parsed");
        }
      })();
    }, 520);
  }

  return (
    <section className="command-center-shell relative rounded-lg">
      <div className="panel-surface relative overflow-hidden rounded-lg">
        <div className="border-b border-white/8 bg-white/[0.022] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-200/16 bg-fuchsia-200/7 px-3 py-1 text-xs font-semibold text-fuchsia-100">
                <Sparkles className="h-3.5 w-3.5" />
                AI Command Center
              </div>
              <h2 className={hero ? "text-balance text-3xl font-semibold leading-[1.04] text-white sm:text-5xl" : "text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl"}>
                Tell the assistant what on-chain behavior to watch.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/58 sm:text-base">
                The core workflow is prompt, backend parse, review, and save. Parsing returns validated structured JSON, not chat.
              </p>
            </div>
            <div className="grid w-full max-w-sm grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/9 bg-black/12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-xl">
              {[
                ["Parse", phase === "parsing" ? "Running" : phase === "idle" ? "Needed" : phase === "error" ? "Check" : "Ready"],
                ["Preview", phase === "parsed" || phase === "saving" || phase === "saved" ? "Built" : "Waiting"],
                ["Save", phase === "saving" ? "Saving" : phase === "saved" ? "Active" : "Backend"],
              ].map(([label, value]) => (
                <div key={label} className="bg-white/[0.025] p-3 backdrop-blur-xl">
                  <p className="text-xs text-white/38">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_0.82fr]">
          <div>
            <Textarea
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setParsedRule(null);
                setParseError(null);
                setPhase(event.target.value.trim() ? "idle" : "error");
              }}
              className={hero ? "min-h-40 text-base" : "min-h-32"}
              placeholder="Example: If a monitored wallet sends more than 1,000 USDT, notify me in Slack."
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {examplePrompts.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setPrompt(example);
                    void parsePrompt(example);
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/62 transition hover:border-white/14 hover:bg-white/[0.058] hover:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
            {phase === "error" ? (
              <p className="mt-3 text-sm text-red-200">{parseError ?? "Enter a supported rule request before parsing."}</p>
            ) : null}
            {phase === "saved" ? (
              <p className="mt-3 text-sm text-emerald-200">Automation saved and synced into active rules.</p>
            ) : null}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/44">
                {phase === "idle" ? "Parse the prompt to rebuild the structured preview." : "Structured preview is generated by the backend parser."}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => void parsePrompt(prompt)} disabled={phase === "parsing" || phase === "saving"}>
                  {phase === "parsing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Parse
                </Button>
                <Button onClick={save} disabled={!canSave}>
                  {phase === "saving" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : phase === "saved" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {phase === "idle" ? "Parse first" : phase === "saving" ? "Saving" : phase === "saved" ? "Saved" : "Save automation"}
                </Button>
              </div>
            </div>
          </div>

          <div className="glass-subtle rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-fuchsia-100" />
                <p className="text-sm font-semibold">Structured automation preview</p>
              </div>
              <Badge tone={phase === "saved" ? "green" : phase === "parsing" || phase === "saving" ? "yellow" : "pink"}>
                {phase === "parsing" ? "Parsing" : phase === "saving" ? "Saving" : phase === "saved" ? "Active" : "Preview"}
              </Badge>
            </div>
            <AnimatePresence mode="wait">
              {phase === "parsing" || phase === "saving" ? (
                <motion.div
                  key="parsing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {(phase === "saving"
                    ? ["Creating automation rule", "Syncing active rules", "Updating notification state"]
                    : ["Reading intent", "Extracting threshold", "Mapping notification action"]
                  ).map((step, index) => (
                    <motion.div
                      key={step}
                      className="glass-subtle rounded-lg p-4"
                      animate={{ opacity: [0.42, 1, 0.42] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.16 }}
                    >
                      <p className="text-sm font-semibold">{step}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-2/3 rounded-full bg-fuchsia-200/70" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {parsedRule ? (
                    <>
                      <PreviewLeg label="IF" value={`${parsedRule.condition.field} ${parsedRule.condition.operator} ${parsedRule.condition.value}`} />
                      <div className="flex justify-center text-white/30">
                        <ArrowRight className="h-5 w-5 rotate-90" />
                      </div>
                      <PreviewLeg label="THEN" value={`${parsedRule.action_type} / ${parsedRule.action.message}`} />
                      <PreviewLeg label="SCOPE" value={parsedRule.monitored_scope} />
                      <div className="rounded-lg border border-emerald-200/12 bg-emerald-200/6 p-4">
                        <p className="text-xs font-semibold uppercase text-emerald-100">Structured parser output</p>
                        <p className="mt-2 text-sm leading-6 text-white/58">{parsedRule.description}</p>
                        <div className="mt-3 grid gap-2 text-xs text-white/42 sm:grid-cols-2">
                          <span>condition_type: {parsedRule.condition_type}</span>
                          <span>token: {parsedRule.token ?? "any"}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="raised-row rounded-lg p-4">
                      <p className="text-sm font-semibold text-white">Awaiting backend parser</p>
                      <p className="mt-2 text-xs leading-5 text-white/50">
                        Enter a supported rule and parse it to generate the automation preview.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewLeg({ label, value }: { label: string; value: string }) {
  return (
    <div className="raised-row rounded-lg p-4">
      <p className="text-xs font-semibold uppercase text-fuchsia-100">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-white">{value}</p>
    </div>
  );
}
