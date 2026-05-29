# AI Web3 Automation Assistant

A premium AI-powered Web3 automation workspace for monitoring wallets, creating natural-language automation rules, reviewing transactions, and receiving operational notifications.

This is not a swap app, NFT marketplace, or generic dashboard. It is an AI infrastructure workspace for blockchain operations.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn-style local UI primitives
- Framer Motion
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- `@supabase/supabase-js`
- `@supabase/ssr`
- Alchemy HTTP APIs for MVP wallet enrichment
- Google Gemini Flash REST API for live AI parsing and transaction summaries

## Local Project Path

```text
D:\Codex\Projects\ai-web3-automation-assistant
```

## Setup

Install dependencies:

```powershell
cd D:\Codex\Projects\ai-web3-automation-assistant
$env:npm_config_cache='D:\Codex\npm-cache'
$env:TEMP='D:\Codex\Temp'
$env:TMP='D:\Codex\Temp'
npm install
```

Create `.env.local` from `.env.local.example`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
ALCHEMY_API_KEY=
GEMINI_API_KEY=
GEMINI_RULE_PARSER_MODEL=gemini-2.5-flash-lite
GEMINI_TRANSACTION_SUMMARY_MODEL=gemini-2.5-flash-lite
```

Run the dev server:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

## Demo Login

```text
Email: demoaccount@gmail.com
Password: password
```

## Connected Systems

- Supabase Auth sign-in/sign-up.
- Protected app routes.
- Wallet read/create/delete API integration.
- Wallet enrichment and manual refresh through Alchemy when `ALCHEMY_API_KEY` is configured.
- Automation list/create/edit/status/delete API integration.
- Transaction list/detail API integration.
- Notification feed/read API integration.
- Gemini-backed AI rule parsing route for supported MVP automation prompts, with deterministic fallback.
- Gemini-backed transaction intelligence summaries, with deterministic fallback.

## Still Mocked or Placeholder

- Wallet balances and recent transactions are blockchain-derived when `ALCHEMY_API_KEY` is configured; otherwise enrichment is skipped gracefully.
- Risk and 24h change are still simplified placeholders.
- Transactions can be seeded demo rows or provider-ingested rows from wallet enrichment.
- AI transaction explanations use Gemini Flash when configured, then deterministic fallback if the provider fails.
- AI rule parsing uses Gemini Flash when configured, then deterministic fallback if the provider fails or returns malformed JSON.
- Automation rules are stored but not executed by a worker.
- Notifications are stored but not delivered through external channels.

## Useful Commands

```powershell
npm run lint
npm run build
npm run dev
npm run qa:gemini
```

## Handoff Files

- `PROJECT_CONTEXT.md`: master project memory.
- `CURRENT_STATE.md`: latest implementation state and next step.
- `DESIGN_SYSTEM.md`: visual and UX rules.
- `BACKEND_CONTEXT.md`: Supabase/backend architecture.
- `AGENTS.md`: required after-code explanation format.
