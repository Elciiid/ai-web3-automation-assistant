import { Badge } from "@/components/ui/badge";
import type { RuleStatus, TransactionStatus } from "@/types";

export function StatusBadge({ status }: { status: RuleStatus | TransactionStatus | "low" | "medium" | "high" }) {
  const tone =
    status === "active" || status === "confirmed" || status === "low"
      ? "green"
      : status === "paused" || status === "pending" || status === "medium"
        ? "yellow"
        : status === "draft"
          ? "blue"
          : "red";

  return <Badge tone={tone}>{status}</Badge>;
}
