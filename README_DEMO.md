# AI Web3 Automation Assistant Demo Guide

## Project Overview

AI Web3 Automation Assistant is a premium Web3 infrastructure workspace for monitoring blockchain wallets, creating automation rules with natural language, and receiving AI-assisted operational alerts.

The product is not a token swap app, NFT marketplace, trading bot, or generic analytics dashboard. It is a recruiter-demo-ready MVP for AI-powered blockchain automation.

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn-style local UI primitives
- Supabase Auth and Postgres
- Supabase RLS for user-owned app data
- Alchemy for blockchain wallet enrichment
- Google Gemini Flash Lite for rule parsing and transaction summaries
- Telegram Bot API for optional external digest delivery

## Architecture

```text
Frontend
  -> Next.js API Routes
  -> Service Layer
  -> Supabase Postgres
  -> Alchemy / Gemini / Telegram
```

The frontend stays focused on product interaction. API routes handle authentication and validation. Services contain the domain logic for wallets, enrichment, automation execution, AI parsing, AI summaries, and notification delivery.

## Demo Login

```text
Email: demoaccount@gmail.com
Password: password
```

## Recommended Demo Flow

1. Sign in with the demo account.
2. Open the Dashboard and point out the AI Command Center.
3. Create a rule such as:

```text
Notify me when this wallet receives over 1000 USDC
```

4. Open Settings.
5. Run one Demo monitoring cycle.
6. Return to Dashboard, Wallets, Transactions, and Notifications to show newly refreshed backend data.

## Environment Variables

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALCHEMY_API_KEY=
GEMINI_API_KEY=
GEMINI_RULE_PARSER_MODEL=gemini-2.5-flash-lite
GEMINI_TRANSACTION_SUMMARY_MODEL=gemini-2.5-flash-lite
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ENABLE_TELEGRAM_NOTIFICATIONS=false
ENABLE_SCHEDULED_MONITORING=false
```

Keep `ENABLE_TELEGRAM_NOTIFICATIONS` and `ENABLE_SCHEDULED_MONITORING` disabled unless intentionally testing those paths. This protects limited Alchemy and Gemini usage.

## What Is Real

- Supabase Auth and protected routes.
- User-owned wallet records.
- Wallet create/delete flows.
- Alchemy-backed wallet enrichment.
- Blockchain-derived transaction ingestion.
- Gemini-backed automation rule parsing.
- Gemini-backed transaction summaries.
- Automation execution against newly ingested transactions.
- In-app notification creation.
- Optional Telegram digest delivery.
- Protected manual demo monitoring run.

## What Is Still Demo or Placeholder

- No production blockchain indexer.
- No realtime websocket monitoring.
- No queue or distributed worker system.
- No external Slack/email/webhook delivery.
- Wallet risk scoring and 24h change are simplified placeholders.
- Advanced wallet-level AI behavioral analysis is not implemented yet.

## Recruiter Talking Points

- The app separates UI, API routes, services, database access, provider integrations, and formatting utilities.
- The core workflow is operational: wallet refresh leads to transaction ingestion, AI summaries, automation evaluation, and notifications.
- AI is used as structured infrastructure, not as a chatbot.
- Provider usage is controlled by explicit demo actions and disabled-by-default scheduled monitoring.
- The design system is intentionally calm, minimal, and premium to match Web3 infrastructure software.

## Screenshots Placeholder

Add final screenshots here before portfolio submission:

- Landing page
- Dashboard with AI Command Center
- Settings demo monitoring control
- Wallet monitoring page
- Transaction detail drawer
- Notifications feed
- Telegram digest example
