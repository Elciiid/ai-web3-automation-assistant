import { ArrowRight, Bell, Braces, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WorkflowPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="panel-surface relative overflow-hidden rounded-lg p-4">
      <div className="relative flex items-center justify-between">
        <Badge tone="pink">AI parsed rule</Badge>
        <div className="flex items-center gap-1 text-xs text-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ready
        </div>
      </div>
      <div className={compact ? "relative mt-4 grid gap-3" : "relative mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr]"}>
        <div className="glass-subtle rounded-lg p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-white/42">
            <Braces className="h-4 w-4" />
            IF
          </div>
          <p className="text-sm text-white">transfer &gt; 1000 USDT</p>
          <p className="mt-2 text-xs text-white/46">Any monitored wallet</p>
        </div>
        <div className="hidden items-center text-white/30 sm:flex">
          <ArrowRight className="h-5 w-5" />
        </div>
        <div className="glass-subtle rounded-lg p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-white/42">
            <Bell className="h-4 w-4" />
            THEN
          </div>
          <p className="text-sm text-white">notify user instantly</p>
          <p className="mt-2 text-xs text-white/46">In-app plus Slack</p>
        </div>
      </div>
    </div>
  );
}
