# Midas AI 💰

> An intelligent personal finance management application powered by AI that helps you track expenses, manage budgets, and gain financial insights through natural language processing.

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.86.0-3ECF8E?logo=supabase)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Core Functionalities](#core-functionalities)
- [AI Integration](#ai-integration)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

Midas AI is a modern, AI-powered personal finance tracker that simplifies expense management through natural language input. Users can add transactions by simply typing or speaking in natural language (e.g., "Spent $50 on groceries" or "Comprei um café por R$15"), and the AI automatically categorizes and processes the transaction.

The application features:
- 🎤 **Voice & Text Input**: Add transactions via speech recognition or text
- 🤖 **AI-Powered Parsing**: Automatic transaction categorization and amount extraction
- 📊 **Smart Analytics**: Real-time insights and budget tracking
- 🔄 **Recurring Transactions**: Automated monthly bills and income
- 📱 **Responsive Design**: Mobile-first UI with dark mode support
- 🔐 **Secure Authentication**: User authentication via Supabase Auth

## ✨ Key Features

### 1. **Smart Transaction Input**
- Natural language processing for transaction entry
- Voice recognition support (Web Speech API)
- Automatic detection of:
  - Transaction amount
  - Description
  - Category
  - Transaction type (income/expense)
  - Date
  - Installment payments (e.g., "in 10x")

### 2. **AI-Powered Features**
- Intelligent transaction parsing using OpenAI
- Personalized financial insights based on spending patterns
- Automatic category suggestions
- Budget goal recommendations

### 3. **Transaction Management**
- **Three-Category System**: Organize finances into **Income**, **Fixed Expenses**, and **Variable Expenses**.
- **Smart Payment Tracking**:
  - **Fixed Expenses**: Track paid/unpaid status with visual indicators (Green/Red).
  - **Variable Expenses & Income**: Simplified view without payment status.
- **Cascading Deletion**: Removing a recurring item automatically cleans up associated future and past transactions.
- **Installment Tracking**: Automatically handles installment payments (e.g., "in 10x").

### 4. **Dashboard & Analytics**
- **Category Summary Cards**: Dedicated cards for Income, Fixed, and Variable expenses.
- **Smart Stats**:
  - Income: Shows total received.
  - Fixed Expenses: Shows paid vs. pending amount.
  - Variable Expenses: Shows total spent.
- **Interactive Charts**: Visual progress indicators and budget comparisons.

### 5. **Recurring Transactions**
- Set up monthly recurring income/expenses.
- Automatic transaction generation on specified days.
- **Smart Cleanup**: Deleting a recurring rule offers to remove all associated history.

### 6. **User Experience**
- **Mobile-First Design**: Optimized for touch interfaces.
- **Swipe Gestures**: Swipe right on Fixed Expenses to mark as paid (Mobile).
- **Desktop Navigation**: Quick access links in the header for easy navigation.
- **Dark/Light Mode**: Seamless theme switching.
- **Responsive Layout**: Adapts from mobile lists to desktop dashboards.

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0**: UI framework
- **TypeScript 5.8.2**: Type-safe development
- **Vite 6.2.0**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework (via CDN)
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

### Backend & Services
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions (AI proxy)
- **OpenAI API**: Natural language processing (via Supabase Edge Function)

### APIs & Browser Features
- **Web Speech API**: Voice recognition
- **Crypto API**: UUID generation

## 🏗️ Architecture

### Component Structure

```
App.tsx (Main Container)
├── Login.tsx (Authentication)
├── SmartInput.tsx (AI-powered input)
├── DashboardStats.tsx (Category summary cards)
├── CategoryTabs.tsx (Category filter tabs)
├── TransactionCard.tsx (Individual transaction with payment status)
├── SummaryCards.tsx (Financial overview)
├── TransactionList.tsx (Legacy transaction display)
├── StatsCards.tsx (Analytics & budgets)
├── InsightsComponent.tsx (AI insights)
├── FixedIncomeModal.tsx (Recurring transactions)
├── FloatingChat.tsx (Conversational AI assistant)
├── LandingPage.tsx (Public landing page)
└── BottomNav.tsx (Mobile navigation)
```

### Data Flow

1. **User Input** → SmartInput component
2. **AI Processing** → OpenAI via Supabase Edge Function
3. **Data Parsing** → AIParsedTransaction interface
4. **State Update** → React state management
5. **Database Sync** → Supabase PostgreSQL
6. **UI Update** → Real-time rendering

### State Management

The application uses React hooks for state management:
- `useState`: Local component state
- `useEffect`: Side effects and data fetching
- `useMemo`: Performance optimization for computed values

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account
- OpenAI API key (configured in Supabase Edge Function)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kdo-vini/midasAI.git
cd midasAI
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up Supabase database**

Run the SQL schema in your Supabase SQL editor:
```bash
# See supabase_schema.sql for the complete schema
```

5. **Configure Supabase Edge Function**

Deploy the `ai-proxy` edge function to your Supabase project with your OpenAI API key.

6. **Run the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ |

## 🗄️ Database Schema

### Tables

#### `transactions`
Stores all user transactions (both manual and recurring).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `amount` | NUMERIC | Transaction amount |
| `description` | TEXT | Transaction description |
| `category` | TEXT | Category name |
| `type` | TEXT | 'INCOME' or 'EXPENSE' |
| `date` | TIMESTAMPTZ | Transaction date |
| `is_recurring` | BOOLEAN | Whether generated from recurring rule |
| `recurring_id` | UUID | Links to recurring_transactions |
| `is_paid` | BOOLEAN | Payment status (NEW) |
| `transaction_category` | TEXT | 'income', 'fixed', or 'variable' (NEW) |
| `due_date` | TIMESTAMPTZ | Due date for payment (NEW) |
| `paid_date` | TIMESTAMPTZ | When marked as paid (NEW) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

#### `recurring_transactions`
Stores recurring transaction rules.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `name` | TEXT | Recurring item name |
| `amount` | NUMERIC | Transaction amount |
| `category` | TEXT | Category name |
| `type` | TEXT | 'INCOME' or 'EXPENSE' |
| `day_of_month` | INTEGER | Day to generate transaction |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

#### `budget_goals`
Stores user budget targets per category.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `category` | TEXT | Category name |
| `target_percentage` | NUMERIC | Target % of total expenses |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

### Security

All tables use **Row Level Security (RLS)** to ensure users can only access their own data. Policies are defined for SELECT, INSERT, UPDATE, and DELETE operations.

## 📁 Project Structure

```
midasAI/
├── components/           # React components
│   ├── BottomNav.tsx    # Mobile bottom navigation
│   ├── CategoryTabs.tsx # Category filter tabs (Income/Fixed/Variable)
│   ├── DashboardStats.tsx # Top summary cards with stats
│   ├── FixedIncomeModal.tsx  # Recurring transactions modal
│   ├── InsightsComponent.tsx # AI-generated insights
│   ├── Login.tsx        # Authentication component
│   ├── SmartInput.tsx   # AI-powered input field
│   ├── StatsCards.tsx   # Budget and analytics cards
│   ├── SummaryCards.tsx # Income/expense summary
│   ├── TransactionCard.tsx # Individual transaction card with swipe/checkbox
│   └── TransactionList.tsx  # Transaction list display
├── constants/           # Application constants
│   └── categories.ts    # Default category list
├── services/            # External service integrations
│   ├── openaiService.ts # AI parsing and insights
│   └── supabase.ts      # Database operations
├── supabase/            # Supabase configuration
│   ├── config.toml      # Supabase project config
│   └── functions/       # Edge functions
│       └── ai-proxy/    # OpenAI proxy function
├── public/              # Static assets
├── App.tsx              # Main application component
├── types.ts             # TypeScript type definitions
├── index.tsx            # Application entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── supabase_schema.sql  # Database schema
```

## 🎯 Core Functionalities

### 1. AI Transaction Parsing

**File**: `services/openaiService.ts`

The `parseTransactionFromText` function sends user input to OpenAI via Supabase Edge Function:

```typescript
Input: "Spent $50 on groceries yesterday"
Output: {
  isTransaction: true,
  amount: 50,
  description: "groceries",
  category: "Alimentação",
  type: "EXPENSE",
  date: "2025-11-27T00:00:00.000Z"
}
```

### 2. Installment Payment Processing

**File**: `App.tsx` (lines 155-214)

Handles installment purchases by creating multiple transactions:

```typescript
Input: "Bought laptop for $1200 in 12x"
Output: 12 transactions of $100 each, one per month
```

### 3. Recurring Transaction Automation

**File**: `App.tsx` (lines 89-137)

Automatically generates transactions from recurring rules on the specified day of each month.

### 4. Budget Tracking

**File**: `components/StatsCards.tsx`

Compares actual spending against budget goals and displays progress indicators.

### 5. Voice Recognition

**File**: `components/SmartInput.tsx`

Uses Web Speech API for voice-to-text transaction input with real-time transcription.

## 🤖 AI Integration

### OpenAI Integration via Supabase Edge Function

The application uses a Supabase Edge Function (`ai-proxy`) to securely communicate with OpenAI's API without exposing API keys to the client.

**Request Types**:

1. **Parse Transaction** (`type: 'parse'`)
   - Extracts transaction details from natural language
   - Returns structured `AIParsedTransaction` object

2. **Generate Insights** (`type: 'insight'`)
   - Analyzes spending patterns
   - Provides personalized financial advice
   - Compares against budget goals

3. **Chat Assistant** (`type: 'chat'`)
   - Conversational financial advice
   - Context-aware responses (considering current budget and spending)
   - Supports Markdown formatting (bold, lists)
   - Category-aware (knows that "snacks" = "Alimentação")

### AI Response Structure

```typescript
interface AIParsedTransaction {
  isTransaction: boolean;    // Validates if input is financial
  amount?: number;           // Transaction amount
  description?: string;      // Transaction description
  category?: string;         // Matched category
  type?: 'INCOME' | 'EXPENSE';
  date?: string;            // ISO date string
  installments?: number;    // Number of installments
  message?: string;         // AI response for questions
}
```

## 📱 Deployment

### GitHub Pages

The project is configured for GitHub Pages deployment:

```bash
npm run deploy
```

This will:
1. Build the production bundle
2. Deploy to `gh-pages` branch
3. Publish to: `https://kdo-vini.github.io/midasAI/`

### Manual Deployment

```bash
# Build
npm run build

# Preview build
npm run preview

# Deploy dist/ folder to your hosting service
```

### Environment Setup for Production

Ensure your production environment has:
- Supabase project URL and keys configured
- Edge Function deployed with OpenAI API key
- CORS settings configured for your domain

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to GitHub Pages |

### Code Style

- TypeScript strict mode enabled
- React 19 with functional components and hooks
- Tailwind CSS for styling
- ESM module format

### Key Development Patterns

1. **Optimistic Updates**: UI updates immediately, then syncs with database
2. **Error Handling**: Try-catch blocks with user-friendly toast notifications
3. **Type Safety**: Full TypeScript coverage with defined interfaces
4. **Responsive Design**: Mobile-first approach with conditional rendering

## 🐛 Troubleshooting

### Common Issues

**Issue**: AI parsing not working
- **Solution**: Verify Supabase Edge Function is deployed and OpenAI API key is configured

**Issue**: Voice recognition not working
- **Solution**: Ensure HTTPS connection (required for Web Speech API) and microphone permissions

**Issue**: Transactions not saving
- **Solution**: Check Supabase RLS policies and user authentication status

**Issue**: Dark mode not persisting
- **Solution**: Check localStorage permissions in browser

## 📝 Default Categories

The application includes 12 default categories (Portuguese):
- Alimentação (Food)
- Transporte (Transportation)
- Moradia (Housing)
- Lazer (Leisure)
- Saúde (Health)
- Educação (Education)
- Investimentos (Investments)
- Salário (Salary)
- Serviços (Services)
- Compras (Shopping)
- Viagem (Travel)
- Outros (Others)

## 🤝 Contributing

When contributing to this project:

1. Understand the AI parsing flow in `openaiService.ts`
2. Maintain TypeScript type safety
3. Follow the existing component structure
4. Test with both voice and text input
5. Ensure mobile responsiveness
6. Update this README for significant changes

## 📄 License

This project is private and not licensed for public use.

## 👤 Author

**Vinicius** (kdo-vini)

---

**Note for AI/Future Developers**: This application relies heavily on AI integration for transaction parsing. The core logic is in the Supabase Edge Function (`ai-proxy`), which must be properly configured with OpenAI API credentials. The frontend handles optimistic updates and state management, while Supabase manages authentication, database, and AI proxy functionality.
