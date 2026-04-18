# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start dev server (port 3000 by default, dev uses 3999)
npm run build          # Production build (Turbopack — will fail with Chinese dir path, see note below)
npm run lint           # ESLint check
npx prisma db push     # Push schema changes to MySQL
npx prisma generate    # Regenerate Prisma client after schema changes
npx tsc --noEmit       # Type-check without emitting (recommended since build may fail)
```

Database connection is in `.env` as `DATABASE_URL`. MySQL only.

**Turbopack / Chinese path issue**: Next.js 16 uses Turbopack by default for both dev and build. The project directory contains Chinese characters ("订阅管理"), which triggers a Turbopack panic when compiling certain API routes with longer internal identifiers. The workaround is to use flat route paths (e.g., `/api/notify-config` instead of `/api/notifications/config`). If adding new API routes under deeply nested paths, test them immediately. Use `npx tsc --noEmit` for type-checking since `npm run build` may fail on this path.

## Architecture

**Stack**: Next.js 16 (App Router) + Prisma 6 + MySQL + shadcn/ui (base-nova style, Tailwind CSS v4) + Recharts + node-cron + Nodemailer

**Important version note**: This is Next.js 16 with breaking changes from older versions. Shadcn/ui uses base-nova style (Radix v2 / Base UI), which means `asChild` props do NOT exist — child composition is automatic. Select `onValueChange` callbacks receive `(value: string | null, details)` not just `(value: string)`.

### Data flow

- `src/app/page.tsx` — Single-page client component, manages all state, renders three tabs (Dashboard / Analytics / Settings)
- `src/app/api/` — REST API routes, Prisma ORM
  - `subscriptions/` — CRUD + search/filter query params
  - `subscriptions/[id]/renew/` — POST extends endDate by one billing cycle
  - `stats/` — Aggregated dashboard metrics
  - `notify-config` — GET/PUT notification settings (singleton with id "default")
  - `notify-check` — POST triggers subscription expiry check and sends notifications
  - `notify-test` — POST sends test email or webhook
  - `notify-logs` — GET recent notification logs
  - `seed/` — POST to populate demo data
- `src/lib/prisma.ts` — Singleton PrismaClient
- `src/lib/types.ts` — All shared types, constants, label maps, `getNextRenewalDate()` utility
- `src/lib/crypto.ts` — AES encrypt/decrypt for stored passwords, master key in localStorage
- `src/lib/notify.ts` — Email (Nodemailer SMTP) and webhook (钉钉/企微/飞书) notification sender + `checkAndNotify()` main logic
- `src/lib/scheduler.ts` — node-cron scheduler, started via `src/instrumentation.ts` on server boot

### Key patterns

- **Renewal date calculation**: `getNextRenewalDate()` in types.ts auto-calculates the next renewal date from `startDate + billingCycle` when `endDate` is not set. All dates are normalized to midnight (`.setHours(0,0,0,0)`) before comparison to avoid timezone issues (UTC vs local). Used in stats API, notify service, card, and table components.
- **Expired subscriptions**: The GET `/api/subscriptions` route auto-detects expired active subscriptions and updates them to "expired" status in the background (fire-and-forget Prisma updateMany).
- **Password encryption**: Client-side AES via crypto-js. Master key stored in browser localStorage only. Form sends pre-encrypted `encryptedPassword` to API; API never sees plaintext.
- **Hydration safety**: Components that read `localStorage` (e.g., `MasterKeyBadge`) must use a `mounted` state guard to avoid server/client mismatch.
- **Search debounce**: 300ms debounce in page.tsx via `useRef` timer, separates `search` (immediate UI) from `debouncedSearch` (API trigger).
- **Notification config**: Singleton `NotificationConfig` with id "default". GET masks `smtpPass`, PUT only updates password if not the mask string "••••••".
- **Scheduled notifications**: node-cron runs every minute, checks if current hour matches `config.checkHour`, then calls `checkAndNotify()`.
- **Toast notifications**: Sonner library, configured in `src/components/ui/sonner.tsx` using the app's custom ThemeProvider (not next-themes).
- **Export**: CSV export with BOM for Chinese characters, generated client-side.

### Component organization

- `src/components/subscriptions/` — Feature components: form, card, table, filters, renew dialog, delete dialog, credential viewer, master key setup, notification settings
- `src/components/dashboard/` — Stats overview cards
- `src/components/charts/` — Recharts wrappers (area, pie, bar)
- `src/components/ui/` — shadcn/ui primitives (do not manually edit)
- `src/components/theme-provider.tsx` — Custom light/dark theme context

### Database schema (Prisma)

Three models in `prisma/schema.prisma`:
- **Subscription**: name, platform, plan, amount, currency, billingCycle (monthly/yearly/weekly), status (active/trialing/cancelled/expired), category, dates, account, encryptedPassword, remindDays
- **NotificationConfig**: Singleton (id "default") with email SMTP settings, webhook settings (type + URL for 钉钉/企微/飞书), checkHour
- **NotificationLog**: type (email/webhook), status (success/failed), title, content, error

After any schema change, run `npx prisma db push && npx prisma generate`.

### Notification flow

1. Scheduler (`src/lib/scheduler.ts`) triggers at configured hour daily
2. `checkAndNotify()` in `src/lib/notify.ts` finds active subscriptions whose auto-calculated next renewal falls within `remindDays`
3. Sends via enabled channels: email (Nodemailer SMTP) and/or webhook (钉钉 markdown / 企微 markdown / 飞书 interactive card)
4. Each send attempt creates a `NotificationLog` entry for audit trail
