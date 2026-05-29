"use client";

import { useSearchParams } from "next/navigation";

export function usePageSearch() {
  const searchParams = useSearchParams();
  return (searchParams.get("q") ?? "").trim().toLowerCase();
}
