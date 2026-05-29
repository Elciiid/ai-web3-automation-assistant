"use client";

import { AiCommandCenter } from "@/components/product/ai-command-center";

export function AiCommandCard({ compact = false }: { compact?: boolean }) {
  return <AiCommandCenter hero={!compact} />;
}
