# Backend Context

## Current Architecture

The backend foundation uses Supabase for authentication, Postgres storage, row-level security, and server-side data access through Next.js App Router API routes.

The frontend has been migrated incrementally. Automations, notifications, wallets, and transactions now read or mutate through the Supabase-backed API layer. Some remaining UI state is still local where it is purely presentational.

Wallet enrichment uses Alchemy from server-side services only. It is an MVP enrichment layer, not a realtime indexer or monitoring worker.

## Supabase Project

Target project:

```text
cghlqwwrwexmppairvux
```

Local environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ALCHEMY_API_KEY
GEMINI_API_KEY
GEMINI_RULE_PARSER_MODEL
GEMINI_TRANSACTION_SUMMARY_MODEL
```

## Supabase Utilities

Client utilities live in `src/lib/supabase`:

- `client.ts`: browser Supabase client for client components.
- `server.ts`: request-scoped server Supabase client for route handlers and server code.
- `middleware.ts`: refreshes auth cookies and protects app routes.
- `database.types.ts`: typed access to app tables.

Backend service functions live in `src/services`. API route handlers validate input, get the authenticated user, call services, and return JSON.

## Database Models

- `profiles`: one profile per Supabase Auth user. Stores email, full name, avatar URL, and creation time.
- `wallets`: user-owned monitored wallet records with address, label, chain, creation time, enrichment status, native balance, native symbol, estimated USD value, token summary JSON, enrichment timestamp, and enrichment error.
- `automation_rules`: user-owned automation definitions created from natural language prompts. Stores raw prompt, parsed JSON, condition fields, action type, token, status, and optional wallet scope.
- `transactions`: wallet-owned transaction records with hash, type, token, amount, source/destination addresses, timestamp, and optional AI summary.
- `notifications`: user-owned alert records with title, message, severity type, read state, and creation time.

RLS is enabled on the new app tables. Policies restrict users to their own profile, wallets, automations, transactions for their wallets, and notifications.

The app-table RLS policies use `(select auth.uid())` so Supabase can evaluate the authenticated user once per statement instead of once per row.

## Authentication Flow

The current auth foundation uses Supabase email/password auth.

- `/sign-up` calls `supabase.auth.signUp`.
- `/sign-in` calls `supabase.auth.signInWithPassword`.
- Protected workspace routes redirect logged-out users to `/sign-in`.
- Logged-in users can access the product workspace.

Demo login:

```text
Email: demoaccount@gmail.com
Password: password
```

A database trigger creates a profile and inserts demo wallets, automations, transactions, and notifications for new Supabase Auth users. The demo account has also been manually confirmed and seeded.

## API Routes

All API routes return `{ data }` on success and `{ error }` on failure.

- `GET /api/wallets`: list wallets for the signed-in user.
- `POST /api/wallets`: create a wallet and attempt provider enrichment when Alchemy is configured.
- `DELETE /api/wallets/[id]`: delete a wallet owned by the signed-in user.
- `POST /api/wallets/[id]/refresh`: manually enrich a wallet, update balance fields, and ingest recent provider transfers.
- `GET /api/automations`: list automation rules.
- `POST /api/automations`: create an automation rule.
- `PATCH /api/automations/[id]`: update automation status or editable rule fields.
- `DELETE /api/automations/[id]`: delete an automation rule.
- `GET /api/transactions`: list transactions, optionally filtered by `walletId`.
- `GET /api/transactions/[id]`: fetch one transaction detail.
- `GET /api/notifications`: list notifications.
- `PATCH /api/notifications/[id]`: update notification read state.
- `POST /api/ai/parse-rule`: parse a natural-language automation prompt with Gemini Flash when configured, then deterministic fallback.

## Frontend Integration Status

Connected to backend:

- Auth screens.
- Protected routing.
- Dashboard automation and notification data.
- Dashboard wallet and transaction summary data.
- Wallet list, add wallet, and delete wallet flows.
- Manual wallet refresh and enrichment flow.
- Automation list/create/edit/status/delete flows.
- Transaction list/detail drawer reads.
- Notification feed and read state.
- AI rule parsing route for supported MVP intents.
- AI transaction summaries generated during wallet enrichment.

Still local or placeholder:

- Some UI-only state, such as modal open state and selected transaction state.
- Settings controls.
- AI wallet insight copy.
- 24h wallet change calculations.
- Wallet risk scoring.

## Mock Limitations

The backend is real, but the domain intelligence is still staged:

- Alchemy is connected for manual wallet enrichment when `ALCHEMY_API_KEY` is configured.
- No wallet connection, websocket, background worker, or production indexer is connected.
- Wallet native balances, estimated USD values, token summaries, and recent transfers can be provider-derived.
- Wallet risk and 24h changes are still placeholder logic.
- Transactions may be seeded demo rows or provider-ingested transfer rows.
- AI transaction summaries use Gemini Flash when configured, then deterministic fallback if Gemini is unavailable, quota-blocked, or returns malformed output.
- The AI rule parser uses Gemini Flash when configured, then deterministic fallback if Gemini is unavailable, quota-blocked, returns malformed JSON, or produces an unsupported schema.
- Automation rules are stored but not executed by a backend worker.
- Notifications are stored but not delivered through email, Slack, Telegram, webhooks, or push.

## Security Notes

- The new app tables have RLS enabled.
- App-table RLS policies have been optimized for Supabase's auth initialization plan guidance.
- The shared Supabase project contains unrelated existing tables with security advisor warnings outside this app's new table set.
- Do not expose service-role keys in frontend code.
- Continue using server-side route handlers and service functions for privileged data access.

## Blockchain Enrichment

Provider choice: Alchemy was selected because the MVP needs native balances, ERC-20 balances, token metadata, token prices, and recent transfer history without installing a new SDK or building a low-level indexer.

Server-side flow:

1. A wallet is created or refreshed.
2. `walletEnrichmentService` verifies ownership through Supabase.
3. `alchemyProvider` fetches native balance, token balances, token metadata, token price, and inbound/outbound transfers.
4. `normalization` converts provider payloads into app-level wallet and transaction shapes.
5. Wallet enrichment fields are updated in Supabase.
6. Normalized transfers are upserted into `transactions` by hash.

If `ALCHEMY_API_KEY` is missing, enrichment is marked as `skipped` instead of failing wallet creation.

## Gemini AI Provider

Gemini Flash is the primary live AI provider for the MVP AI layer.

Current local model defaults:

```text
GEMINI_RULE_PARSER_MODEL=gemini-2.5-flash-lite
GEMINI_TRANSACTION_SUMMARY_MODEL=gemini-2.5-flash-lite
```

Provider logic lives in `src/services/geminiProviderService.ts` and uses Gemini's REST `generateContent` endpoint with structured JSON output. The app does not install a Google SDK package, keeping the integration dependency-free and easy to inspect.

Rule parsing flow:

1. Validate prompt length and basic shape.
2. Attempt Gemini structured parsing.
3. Validate the returned JSON against the app's supported schema.
4. Fall back to deterministic parsing if Gemini fails, returns malformed JSON, returns an unsupported intent, or hits quota/rate limits.

Supported rule intents remain intentionally narrow:

- Transfer threshold alerts.
- Receive threshold alerts.
- Token movement alerts.
- Daily wallet summaries.

Transaction summary flow:

1. New provider-ingested transactions are batched in small groups.
2. Gemini Flash generates short operational summaries and classifications.
3. Summaries are validated by batch index, classification, length, and scam-label filtering.
4. Deterministic summaries are stored if Gemini fails or returns malformed output.

Cost controls:

- Flash model only.
- Small prompts.
- Low `maxOutputTokens`.
- No chain-of-thought prompting.
- At most 4 transactions per summary request.
- No retries that could multiply usage.

Existing OpenAI environment variables are retained for possible future reuse, but OpenAI is no longer the primary runtime dependency.

## Future Integration Plan

1. Configure Alchemy and verify enrichment with representative Ethereum, Base, Arbitrum, Optimism, and Polygon wallets.
2. Add optional AI wallet-level insight backfills using Gemini Flash.
3. Add an automation execution worker that evaluates transactions against active rules outside request/refresh cycles.
4. Add scheduled refresh or webhook-based blockchain monitoring.
5. Add real notification delivery channels for Slack, email, webhook, and in-app realtime events.
