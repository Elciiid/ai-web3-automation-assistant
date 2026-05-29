"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSignUp = mode === "sign-up";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const workspaceName = String(formData.get("workspaceName") ?? "");
    const supabase = createClient();

    const result = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: workspaceName || "AI Web3 Operator",
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (isSignUp && !result.data.session) {
      setMessage("Account created. Check your email if confirmation is enabled, then sign in.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="app-radial-bg grid min-h-screen text-white lg:grid-cols-[0.92fr_1.08fr]">
      <div className="noise-overlay" />
      <section className="relative z-10 hidden bg-white/[0.025] p-10 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-black">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">AI Web3 Automation Assistant</span>
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase text-fuchsia-100">Operator workspace</p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.05]">
            Explainable alerts and automations for blockchain teams.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-white/54">
            Monitor wallets, parse rule intent, and review AI-generated activity narratives in one focused product surface.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["5 chains", "24 rules", "148 AI notes"].map((item) => (
            <div key={item} className="glass-subtle rounded-lg p-4 text-sm font-semibold">
              {item}
            </div>
          ))}
        </div>
      </section>
      <section className="relative z-10 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6">
          <div className="mb-7">
            <BadgeLine />
            <h2 className="mt-5 text-3xl font-semibold">{isSignUp ? "Create workspace" : "Welcome back"}</h2>
            <p className="mt-3 text-sm leading-6 text-white/52">
              {isSignUp
                ? "Start with a frontend demo workspace and realistic mock operations data."
                : "Access the AI automation dashboard demo experience."}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {isSignUp ? <Input name="workspaceName" placeholder="Workspace name" defaultValue="Aperture Labs" /> : null}
            <Input name="email" type="email" placeholder="Email" defaultValue={isSignUp ? "operator@aperture.xyz" : "demoaccount@gmail.com"} required />
            <Input name="password" type="password" placeholder="Password" defaultValue="password" required />
            {error ? (
              <p className="rounded-lg border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-100">{error}</p>
            ) : null}
            {message ? (
              <p className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">{message}</p>
            ) : null}
            <Button className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-white/48">
            {isSignUp ? "Already have an account?" : "New to the platform?"}{" "}
            <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-semibold text-white">
              {isSignUp ? "Sign in" : "Create one"}
            </Link>
          </p>
        </Card>
      </section>
    </main>
  );
}

function BadgeLine() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold text-fuchsia-100">
      <Sparkles className="h-3.5 w-3.5" />
      Secure frontend demo
    </div>
  );
}
