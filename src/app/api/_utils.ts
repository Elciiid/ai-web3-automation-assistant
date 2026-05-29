import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function requiredString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function optionalString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isAllowed<T extends string>(value: string | null, allowed: readonly T[]): value is T {
  return Boolean(value && allowed.includes(value as T));
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected backend error";
}
