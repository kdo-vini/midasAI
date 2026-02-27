# MidasAI — Claude Context

## Project Overview

AI-powered personal finance tracker. Users add transactions via natural language or voice ("Gastei R$50 no mercado"), and the AI automatically parses, categorizes, and saves them.

- **Project root**: `C:\Users\Vinicius\Desktop\Code\MidasAI\` — single folder, git repo root
- **GitHub**: https://github.com/kdo-vini/midasAI
- **Deployment**: GitHub Pages at https://midas.techneia.com.br (not the `.github.io` URL)
- **UI language**: Portuguese (BR) — all user-facing text, categories, and labels are in PT-BR
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Payments**: Stripe (subscriptions + trial periods, via edge functions only)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript (strict mode) |
| Build | Vite 6 — dev server on **port 3000**, host `0.0.0.0` |
| Styling | Tailwind CSS via CDN (`index.html`) + `LandingPage.css` (only CSS file) |
| Database | Supabase PostgreSQL with RLS on all tables |
| Auth | Supabase Auth (JWT) |
| AI | OpenAI via `ai-proxy` Supabase Edge Function (never called client-side) |
| Payments | Stripe via edge functions only — no client-side Stripe SDK |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Toasts | Sonner |
| File Import | PapaParse (CSV) + XLSX (Excel) |
| Push Notifications | Web Push API + Service Worker (`public/sw.js`) |
| UUID | `uuid` npm package |

---

## Development Commands

```bash
npm run dev      # Dev server — http://localhost:3000
npm run build    # Production build → dist/
npm run preview  # Preview production build
npm run deploy   # Build + push to gh-pages branch
```

---

## Project Structure

```
MidasAI/
├── App.tsx                     # Main container — ALL global state here (~1,200 lines)
├── index.tsx                   # Entry point
├── index.html                  # HTML template — Tailwind CDN, gold theme, Outfit+Space Grotesk fonts
├── types.ts                    # All TypeScript interfaces
├── vite.config.ts              # Port 3000, path alias @/ → project root
├── tsconfig.json               # Strict mode, @/ alias
├── package.json
├── .env                        # Gitignored — see env vars section
├── .claude/
│   ├── launch.json             # Dev server config for preview_start
│   └── settings.local.json
├── components/                 # 26 React components
│   ├── SmartInput.tsx          # AI + voice (Web Speech API) transaction input
│   ├── DashboardStats.tsx      # Top summary cards per category
│   ├── CategoryTabs.tsx        # Income / Fixed / Variable filter tabs
│   ├── TransactionCard.tsx     # Transaction row — swipe to pay (mobile), checkbox (desktop)
│   ├── StatsCards.tsx          # Budget tracking with progress bars
│   ├── InsightsComponent.tsx   # AI-generated financial insights
│   ├── FloatingChat.tsx        # Conversational AI assistant (Markdown support)
│   ├── FixedIncomeModal.tsx    # Recurring transaction CRUD
│   ├── StatementImport.tsx     # CSV/Excel bank statement import
│   ├── StatementReportView.tsx # Statement analysis results
│   ├── CategoryManager.tsx     # Custom category management
│   ├── PaywallModal.tsx        # Subscription paywall modal
│   ├── Paywall.tsx             # Full paywall screen
│   ├── OnboardingModal.tsx     # First-time user onboarding
│   ├── Login.tsx               # Supabase auth form
│   ├── LandingPage.tsx         # Public landing page
│   ├── LandingPage.css         # Landing page styles (only non-Tailwind CSS)
│   ├── BottomNav.tsx           # Mobile bottom navigation
│   ├── Logo.tsx                # Logo component
│   ├── SummaryCards.tsx        # Income/expense overview
│   ├── TransactionList.tsx     # Legacy transaction list
│   ├── DeleteConfirmModal.tsx  # Generic delete confirmation
│   ├── CategoryDeleteModal.tsx # Category deletion confirmation
│   ├── PrivacyPolicyModal.tsx  # Privacy policy display
│   ├── EmailConfirmed.tsx      # Post-email-confirmation page
│   └── UpdatePassword.tsx      # Password update form
├── services/
│   ├── supabase.ts             # All DB operations — fetch, save, delete, RLS-enforced
│   ├── openaiService.ts        # AI calls → supabase.functions.invoke('ai-proxy')
│   └── pushNotifications.ts   # Web Push subscription setup
├── constants/
│   └── categories.ts           # Default categories (see below)
├── supabase/
│   └── functions/              # Deno edge functions
│       ├── _shared/cors.ts     # Shared CORS headers
│       ├── ai-proxy/           # OpenAI proxy — parse, insight, chat request types
│       ├── parse-statement/    # CSV/Excel bank statement parsing
│       ├── send-reminders/     # Scheduled push notification reminders
│       ├── stripe-checkout/    # Create Stripe checkout session
│       ├── stripe-portal/      # Stripe customer portal
│       └── stripe-webhook/     # Handle Stripe webhook events
└── public/
    ├── sw.js                   # Service Worker (PWA + push notifications)
    └── [images, privacy policy]
```

---

## Architecture & Key Conventions

### State Management
- All global state in `App.tsx`, passed via props. No Redux/Zustand/Context.
- Pattern: **optimistic updates** — UI updates immediately, then syncs to Supabase.

### Three-Category System
Core business logic: every transaction belongs to one of three categories:
- **Income** — total received, no paid/unpaid tracking
- **Fixed Expenses** — bills with paid/unpaid status (green = paid, red = unpaid). Swipe right on mobile to mark paid.
- **Variable Expenses** — discretionary spending, simplified view without payment status

### Transaction Features
- **Installments**: input "Comprei notebook por R$1200 em 12x" → creates 12 transactions of R$100 each, one per month
- **Recurring transactions**: rules with `dayOfMonth` → auto-generated each month
- **Cascading deletion**: deleting a recurring rule offers to remove all associated historical transactions

### AI Integration — `ai-proxy` edge function
Three request types:
1. **`parse`** — NL text → structured `AIParsedTransaction` (amount, description, category, type, date, installments)
2. **`insight`** — analyzes spending patterns, compares against budget goals, returns advice
3. **`chat`** — conversational assistant with full financial context, returns Markdown

**Rule**: Never call OpenAI directly from client. Always via `services/openaiService.ts` → `supabase.functions.invoke('ai-proxy')`.

### Styling
- Tailwind loaded from CDN in `index.html` — **no `tailwind.config.js`**
- Custom theme: indigo palette overridden to **gold** in `index.html`'s Tailwind config block
- Dark mode via `class` strategy — persisted in `localStorage`
- Fonts: **Outfit** (body) + **Space Grotesk** (headings) from Google Fonts, loaded in `index.html`
- `LandingPage.css` is the only standalone CSS file

### Path Alias
`@/` → project root. Set in both `vite.config.ts` and `tsconfig.json`.

### Auth & Security
- Supabase Auth (JWT). All DB queries use RLS — never bypass with service role key client-side.
- `.env` is gitignored. Never commit secrets.
- Voice recognition (Web Speech API) requires HTTPS.

### Payments
- Stripe exclusively via edge functions. No `@stripe/stripe-js` or client-side Stripe calls.

---

## Database Schema

### `transactions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `amount` | NUMERIC | |
| `description` | TEXT | |
| `category` | TEXT | |
| `type` | TEXT | `'INCOME'` or `'EXPENSE'` |
| `date` | TIMESTAMPTZ | |
| `is_recurring` | BOOLEAN | Generated from recurring rule |
| `recurring_id` | UUID | FK → recurring_transactions |
| `is_paid` | BOOLEAN | For fixed expenses |
| `transaction_category` | TEXT | `'income'`, `'fixed'`, `'variable'`, `'savings'` |
| `due_date` | TIMESTAMPTZ | |
| `paid_date` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

### `recurring_transactions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `name` | TEXT | |
| `amount` | NUMERIC | |
| `category` | TEXT | |
| `type` | TEXT | `'INCOME'` or `'EXPENSE'` |
| `day_of_month` | INTEGER | Day to auto-generate transaction |

### `budget_goals`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `category` | TEXT | |
| `target_percentage` | NUMERIC | % of total expenses |

All tables: RLS enabled, policies for SELECT/INSERT/UPDATE/DELETE per user.

---

## Key Data Types (`types.ts`)

```typescript
Transaction          // transactionCategory: 'income' | 'fixed' | 'variable' | 'savings'
RecurringTransaction // dayOfMonth triggers auto-generation
UserProfile          // stripeCustomerId, subscriptionStatus, trialEndDate, hasSeenOnboarding
AIParsedTransaction  // isTransaction, amount, description, category, type, date, installments, message
MonthlyStats         // totalIncome, totalExpense, balance
BudgetGoal           // category, targetPercentage
```

---

## Default Categories (`constants/categories.ts`)

**Income**: Salário, Rendimentos, Freelance, Outras Receitas

**Expense**: Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Compras, Viagem, Serviços, Outros

Users can add custom categories via `CategoryManager.tsx`.

---

## Environment Variables (`.env`)

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (JWT) | ✅ |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID public key | For push notifications |
