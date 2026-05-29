import type { DashboardMetric } from "@/types";
import { Card } from "@/components/ui/card";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.icon;
  const tone =
    metric.tone === "positive"
      ? "text-emerald-200"
      : metric.tone === "warning"
        ? "text-yellow-100"
        : "text-white/58";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="glass-subtle rounded-lg p-3">
          <Icon className="h-5 w-5 text-fuchsia-100" />
        </div>
        <span className={`text-xs font-semibold ${tone}`}>{metric.delta}</span>
      </div>
      <p className="mt-5 text-sm text-white/48">{metric.label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
    </Card>
  );
}
