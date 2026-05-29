import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10">
        <Sparkles className="h-5 w-5 text-fuchsia-100" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/50">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </Card>
  );
}
