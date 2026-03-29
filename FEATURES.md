# Savvio — Features Documentation

This document explains every feature added to the Savvio expense tracker, how each was implemented, and how they work together.

---

## Table of Contents

1. [Currency Change (NGN)](#1-currency-change-ngn)
2. [Recurring Expenses](#2-recurring-expenses)
3. [Income Tracking](#3-income-tracking)
4. [Export to CSV & PDF](#4-export-to-csv--pdf)
5. [Budget Alerts & Notifications](#5-budget-alerts--notifications)
6. [Multi-Currency Support](#6-multi-currency-support)
7. [Savings Goals](#7-savings-goals)
8. [Expense Splitting](#8-expense-splitting)
9. [Dashboard Date Range Picker](#9-dashboard-date-range-picker)
10. [Profile Settings Page](#10-profile-settings-page)
11. [Receipt Upload](#11-receipt-upload)
12. [Tags & Labels](#12-tags--labels)
13. [Expense Notes & Comments](#13-expense-notes--comments)
14. [Mobile PWA Support](#14-mobile-pwa-support)
15. [Data Visualization Enhancements](#15-data-visualization-enhancements)

---

## 1. Currency Change (NGN)

### What Changed
The default currency was changed from EUR (Euro) to NGN (Nigerian Naira).

### How It Was Implemented
- **File**: `client/src/lib/utils.ts`
- The `formatCurrency()` function uses the browser's `Intl.NumberFormat` API
- Changed locale from `en-MT` to `en-NG` and currency from `EUR` to `NGN`
- All amounts across the app (dashboard, expenses, budgets, etc.) automatically display in Naira because they all call this single utility function

### How It Works
```typescript
new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
// Output: "₦1,234.56"
```

---

## 2. Recurring Expenses

### What It Does
Allows users to set up expenses that repeat on a schedule (daily, weekly, monthly, yearly). When due, they can be automatically converted into actual expense records.

### How It Was Implemented

**Backend** (`server/src/recurring-expenses/`):
- **Prisma Model**: `RecurringExpense` with fields: amount, description, frequency, startDate, endDate, nextDueDate, isActive, categoryId, userId
- **Service**: `RecurringExpensesService` handles CRUD + a `processDueExpenses()` method that:
  1. Finds all active recurring expenses where `nextDueDate <= now`
  2. Creates an actual `Expense` record prefixed with `[Recurring]`
  3. Calculates and updates the `nextDueDate` based on frequency
- **Controller**: REST endpoints at `/recurring-expenses` + `/recurring-expenses/process`
- **Date Calculation**: `calculateNextDueDate()` adds 1 day/7 days/1 month/1 year based on frequency

**Frontend** (`client/src/app/(app)/recurring/page.tsx`):
- Card-based list showing each recurring expense with category, frequency, next due date
- Pause/Resume toggle per item (sets `isActive`)
- "Process due" button triggers auto-generation of pending expenses
- Estimated monthly cost summary (normalizes daily×30, weekly×4, yearly÷12)
- Full CRUD modal for creating/editing recurring expenses

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recurring-expenses` | List all recurring expenses |
| GET | `/recurring-expenses/process` | Process all due expenses |
| POST | `/recurring-expenses` | Create recurring expense |
| PATCH | `/recurring-expenses/:id` | Update recurring expense |
| DELETE | `/recurring-expenses/:id` | Delete recurring expense |

---

## 3. Income Tracking

### What It Does
Track income alongside expenses to show net savings, cash flow, and savings rate.

### How It Was Implemented

**Backend** (`server/src/income/`):
- **Prisma Model**: `Income` with fields: amount, source, description, date, isRecurring, frequency, categoryId, userId
- **Service**: Full CRUD + `getMonthlySummary()` that calculates:
  - Total income for the month
  - Total expenses for the month
  - Net savings (income - expenses)
  - Savings rate percentage: `((income - expenses) / income) × 100`
- **Controller**: REST endpoints at `/income` with filtering by month

**Frontend** (`client/src/app/(app)/income/page.tsx`):
- Summary cards: Total Income (green), Expenses, Net Savings, Savings Rate
- List of income entries with source, description, date
- Recurring income badge indicator
- Month navigation
- Full CRUD modal with optional recurring toggle + frequency selector

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/income?month=YYYY-MM` | List income (filterable) |
| GET | `/income/summary?month=YYYY-MM` | Get income vs expense summary |
| POST | `/income` | Add income |
| PATCH | `/income/:id` | Update income |
| DELETE | `/income/:id` | Delete income |

---

## 4. Export to CSV & PDF

### What It Does
Download your financial data as CSV spreadsheets or generate printable PDF-style monthly reports.

### How It Was Implemented

**Backend** (`server/src/export/`):
- **CSV Export**: `exportExpensesCSV()` and `exportIncomeCSV()` methods
  - Query all records for a given month
  - Build CSV string with headers: Date, Description, Category, Amount, Tags, Notes
  - Return as raw text with `Content-Type: text/csv` header and `Content-Disposition: attachment`
  - Handles CSV escaping (quotes in descriptions)
- **Report Data**: `getReportData()` aggregates:
  - Total income/expenses/net savings
  - Category breakdown with amounts
  - Budget vs. actual comparison per category
  - Full list of expenses and incomes

**Frontend** (`client/src/app/(app)/export/page.tsx`):
- Two CSV download buttons (Expenses, Income) that fetch the CSV endpoint and trigger browser download via `Blob` + `URL.createObjectURL`
- "Generate Report" button that fetches report data and renders it as a styled HTML report
- "Print / Save PDF" button that calls `window.print()` — browsers offer "Save as PDF" in their print dialog
- Report includes: summary cards, spending by category, budget vs. actual table

### How the PDF Works
The report is rendered as styled HTML. When the user clicks "Print / Save PDF":
1. `window.print()` opens the browser's native print dialog
2. The `@media print` styles strip borders/shadows for a clean layout
3. User selects "Save as PDF" in the print dialog
4. This approach requires zero additional dependencies

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export/expenses/csv?month=YYYY-MM` | Download expenses CSV |
| GET | `/export/income/csv?month=YYYY-MM` | Download income CSV |
| GET | `/export/report?month=YYYY-MM` | Get report data (JSON) |

---

## 5. Budget Alerts & Notifications

### What It Does
Automatically warns users when they're approaching (80%) or exceeding (100%) their budget limits per category. Also notifies when savings goals are reached.

### How It Was Implemented

**Backend** (`server/src/notifications/`):
- **Prisma Model**: `Notification` with fields: type, title, message, read, budgetId, userId
- **Budget Schema Updated**: Added `alertAt80` and `alertAt100` boolean flags to Budget model
- **Service**: `NotificationsService` with key method `checkBudgetAlerts()`:
  1. Loads all budgets for the given month
  2. For each budget, aggregates actual spending from expenses
  3. Calculates percentage: `(spent / budgetAmount) × 100`
  4. If >= 80% and < 100%: creates a `budget_warning` notification (once per month)
  5. If >= 100%: creates a `budget_exceeded` notification (once per month)
  6. Deduplication via `findFirst` to prevent repeated alerts
- **Notification Types**: `budget_warning`, `budget_exceeded`, `goal_reached`, `recurring_due`

**Frontend** (`client/src/app/(app)/notifications/page.tsx`):
- Auto-checks budgets on page load via `checkBudgets(currentMonth)`
- Color-coded notification cards by type (amber=warning, red=exceeded, green=goal)
- Mark as read, mark all read, delete
- Notification bell in sidebar with unread count badge (polls every 30 seconds)

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List all notifications |
| GET | `/notifications/unread-count` | Get unread count |
| GET | `/notifications/check-budgets?month=YYYY-MM` | Trigger budget check |
| PATCH | `/notifications/:id/read` | Mark one as read |
| PATCH | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |

---

## 6. Multi-Currency Support

### What It Does
Users can choose their preferred display currency from 12 supported currencies. The selection persists in their profile.

### How It Was Implemented

**Backend**:
- **User Model Updated**: Added `currency` (default: "NGN") and `locale` fields to User
- **Profile Endpoints**: `PATCH /auth/profile` accepts `currency` and `locale` updates
- Auth responses (`register`, `login`, `getProfile`) now return currency info

**Frontend**:
- **`client/src/lib/utils.ts`**: `formatCurrency()` reads the user's currency from `localStorage`
  - `getUserCurrency()` extracts currency from the stored user JSON
  - `CURRENCY_LOCALES` maps each currency code to the appropriate Intl locale
  - `SUPPORTED_CURRENCIES` array provides code, name, and symbol for the settings UI
- **`client/src/lib/auth-context.tsx`**: User interface extended with `currency` and `locale`, `updateUser()` method syncs to localStorage
- **Settings Page**: Visual currency selector grid showing symbol, code, and name for each currency

### Supported Currencies
| Code | Currency | Symbol |
|------|----------|--------|
| NGN | Nigerian Naira | ₦ |
| USD | US Dollar | $ |
| EUR | Euro | € |
| GBP | British Pound | £ |
| GHS | Ghanaian Cedi | GH₵ |
| KES | Kenyan Shilling | KSh |
| ZAR | South African Rand | R |
| INR | Indian Rupee | ₹ |
| JPY | Japanese Yen | ¥ |
| CNY | Chinese Yuan | ¥ |
| CAD | Canadian Dollar | CA$ |
| AUD | Australian Dollar | A$ |

### How Currency Formatting Works
```typescript
// 1. getUserCurrency() reads from localStorage
const currency = getUserCurrency(); // "NGN"

// 2. Looks up the locale
const locale = CURRENCY_LOCALES["NGN"]; // "en-NG"

// 3. Formats using Intl.NumberFormat
new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(1000);
// Output: "₦1,000.00"
```

---

## 7. Savings Goals

### What It Does
Set financial targets (e.g., "Save ₦500,000 for laptop") and track progress with a visual progress bar.

### How It Was Implemented

**Backend** (`server/src/savings-goals/`):
- **Prisma Model**: `SavingsGoal` with fields: name, targetAmount, currentAmount, deadline, color, categoryId, userId
- **Service**: Full CRUD + `addFunds()` method:
  - Adds the specified amount to `currentAmount`
  - If `currentAmount >= targetAmount`, creates a `goal_reached` notification
- **Controller**: REST endpoints + special `PATCH /:id/add-funds`

**Frontend** (`client/src/app/(app)/savings/page.tsx`):
- Summary: Total Saved, Total Target, Overall Progress %
- Goal cards with:
  - Progress bar (color from goal, turns green at 100%)
  - Percentage saved and remaining amount
  - "Add funds" button opens a quick modal
  - Delete button
- Create modal with name, target amount, starting amount, deadline, color picker

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/savings-goals` | List all goals |
| POST | `/savings-goals` | Create goal |
| PATCH | `/savings-goals/:id` | Update goal |
| PATCH | `/savings-goals/:id/add-funds` | Add funds to goal |
| DELETE | `/savings-goals/:id` | Delete goal |

---

## 8. Expense Splitting

### What It Does
Split a single expense across multiple sub-items. For example, a ₦15,000 grocery trip can be split into "Food: ₦10,000" and "Household: ₦5,000".

### How It Was Implemented

**Backend**:
- **Prisma Model**: `ExpenseSplit` with fields: expenseId, label, amount
- **Expense Service Updated**:
  - `create()`: After creating the expense, creates `ExpenseSplit` records via `createMany`
  - `update()`: Deletes existing splits, creates new ones (full replace)
  - `findAll()` and `findOne()`: Include splits in query results
- **DTO Updated**: `CreateExpenseDto` and `UpdateExpenseDto` accept optional `splits: Array<{ label: string; amount: number }>`

**Frontend** (in Expenses page modal):
- "Show advanced options" toggle reveals the splits section
- "Add split" button adds a new label/amount row
- Each split has a label input, amount input, and remove button
- Splits displayed in the expense detail expansion panel
- Split icon indicator on the expense list row

---

## 9. Dashboard Date Range Picker

### What It Does
View analytics for custom date ranges instead of just monthly views.

### How It Was Implemented

**Backend** (`server/src/analytics/`):
- `getDashboardSummary()` and `getCategoryBreakdown()` now accept optional `startDate` and `endDate` parameters
- When custom dates are provided, they override the month-based calculation
- The "previous period" for comparison is calculated as the same duration shifted back

**Frontend** (Dashboard page):
- "Custom range" toggle button with Calendar icon
- When active, shows two date inputs (start and end)
- All analytics API calls pass the custom dates
- When inactive, defaults to monthly view

### How It Works
```
// Without custom range: uses month
GET /analytics/summary?month=2026-03

// With custom range: overrides month
GET /analytics/summary?month=2026-03&startDate=2026-03-01&endDate=2026-03-15
```

---

## 10. Profile Settings Page

### What It Does
Full settings page where users can update their name, email, currency preference, and password.

### How It Was Implemented

**Backend** (`server/src/auth/`):
- **New DTOs**: `UpdateProfileDto` (name, email, currency, locale) and `ChangePasswordDto` (currentPassword, newPassword)
- **AuthService Updated**:
  - `updateProfile()`: Validates email uniqueness, updates user fields
  - `changePassword()`: Verifies current password with bcrypt, hashes new password
- **AuthController Updated**: Added `PATCH /auth/profile` and `POST /auth/change-password`

**Frontend** (`client/src/app/(app)/settings/page.tsx`):
- Three sections with distinct forms:
  1. **Profile**: Name and email fields
  2. **Currency**: Visual grid of 12 supported currencies with symbol, code, name
  3. **Password**: Current password, new password, confirm password with validation
- Each section has its own submit button and loading state
- Updates sync to AuthContext and localStorage immediately

---

## 11. Receipt Upload

### What It Does
Attach receipt URLs to expenses so you can reference proof of purchase later.

### How It Was Implemented

**Backend**:
- **Expense Model Updated**: Added `receiptUrl` field (String, default empty)
- **DTOs Updated**: Both `CreateExpenseDto` and `UpdateExpenseDto` accept optional `receiptUrl`

**Frontend** (in Expenses modal):
- Receipt URL input field in the "advanced options" section
- Upload icon indicator on expense rows that have a receipt
- Clickable receipt link in the expense detail expansion panel

### Note on Image Uploads
The current implementation stores URLs (links to externally hosted images). For actual file uploads, you would need:
1. A file storage service (AWS S3, Cloudinary, etc.)
2. A server endpoint that accepts `multipart/form-data`
3. Return the hosted URL to store in the database

This was designed as URL-based to avoid adding cloud storage dependencies, but can easily be extended.

---

## 12. Tags & Labels

### What It Does
Add custom tags to expenses for flexible cross-category filtering. Tags work independently of categories.

### How It Was Implemented

**Backend** (`server/src/tags/`):
- **Prisma Models**:
  - `Tag`: id, name, color, userId (unique per user by name)
  - `ExpenseTag`: junction table linking expenses to tags (unique per expense-tag pair)
- **TagsService**: Full CRUD for tags + `addTagToExpense()` / `removeTagFromExpense()`
- **ExpensesService Updated**:
  - Creates `ExpenseTag` records when expense has `tagIds`
  - Supports filtering by tagId: `where.expenseTags = { some: { tagId } }`
  - Includes tags in all query results

**Frontend**:
- Tags displayed as colored pills on expense rows
- Tag selector in expense modal (toggle on/off)
- Tags section in expense detail expansion
- Tags can be managed at `/tags` (not a separate page — managed via API)

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List user's tags |
| POST | `/tags` | Create tag |
| PATCH | `/tags/:id` | Update tag |
| DELETE | `/tags/:id` | Delete tag |
| POST | `/tags/expense/:expenseId/tag/:tagId` | Add tag to expense |
| DELETE | `/tags/expense/:expenseId/tag/:tagId` | Remove tag from expense |

---

## 13. Expense Notes & Comments

### What It Does
Add longer notes/comments to individual expenses for additional context.

### How It Was Implemented

**Backend**:
- **Expense Model Updated**: Added `notes` field (String, default empty)
- **DTOs Updated**: Both `CreateExpenseDto` and `UpdateExpenseDto` accept optional `notes`

**Frontend** (in Expenses modal):
- Textarea field in the "advanced options" section
- Notes icon indicator on expense rows
- Notes displayed in the expense detail expansion panel

---

## 14. Mobile PWA Support

### What It Does
Makes Savvio installable as a phone app with offline support and native-like experience.

### How It Was Implemented

**Files Created**:
1. **`client/public/manifest.json`** — Web App Manifest:
   - `name`: "Savvio — Smart Expense Tracker"
   - `display`: "standalone" (no browser chrome)
   - `theme_color`: "#0f172a" (dark slate)
   - `start_url`: "/dashboard"
   - `icons`: 192x192 and 512x512 PNG icons (you need to add these)

2. **`client/public/sw.js`** — Service Worker:
   - **Install**: Pre-caches key app routes
   - **Activate**: Cleans old caches when version changes
   - **Fetch**: Network-first strategy with cache fallback
   - Skips API requests (they should always be live)

3. **`client/src/components/sw-register.tsx`** — Registration component:
   - Registers the service worker on mount
   - Silently fails if SW is not supported

4. **`client/src/app/layout.tsx`** — Updated with:
   - `<link rel="manifest" href="/manifest.json">` (via Next.js metadata)
   - `<meta name="theme-color">` for browser chrome color
   - `<meta name="apple-mobile-web-app-capable">` for iOS
   - `<link rel="apple-touch-icon">` for iOS home screen icon

### How PWA Works (Explained)

**Progressive Web Apps (PWA)** bridge the gap between websites and native apps:

1. **Installation**: When a site has a valid manifest + service worker + HTTPS, browsers show an "Add to Home Screen" prompt. The app then launches from the home screen like a native app.

2. **Standalone Mode**: `"display": "standalone"` removes the browser's URL bar and navigation buttons, making the app look native.

3. **Service Worker**: A JavaScript file that runs in the background (separate from the web page):
   - Acts as a network proxy — intercepts all fetch requests
   - Can serve cached content when offline
   - Runs even when the app is closed (for push notifications, etc.)

4. **Caching Strategy**: We use "network-first":
   - Try the network first (always get fresh data)
   - If the network fails (offline), serve from cache
   - API requests are never cached (financial data must be live)

5. **To make it fully work**, you need:
   - HTTPS in production (required for service workers)
   - Add actual icon PNG files in `/client/public/icons/` (192x192 and 512x512)
   - Deploy to a hosting service (Vercel, Netlify, etc.)

---

## 15. Data Visualization Enhancements

### What Was Added

**New Charts on Dashboard**:

1. **Income vs Expenses Bar Chart** (`/analytics/income-vs-expense`):
   - Side-by-side green (income) and red (expense) bars
   - Shows last 6 months comparison
   - Helps visualize cash flow trends

2. **Weekly Spending Pattern Radar Chart** (`/analytics/weekly-pattern`):
   - Radar/spider chart showing spending by day of week
   - Aggregates all expenses in the month by weekday
   - Reveals which days you spend most (e.g., weekends)

3. **Monthly Trend with Income** (Enhanced):
   - Existing bar chart now shows both expenses AND income
   - Legend distinguishes the two with different colors
   - Uses Recharts `Legend` component

4. **Income Cards on Dashboard**:
   - Total Income card (green theme)
   - Net Savings card (shows surplus/deficit)
   - These give an at-a-glance financial health view

### Backend Analytics Endpoints Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/weekly-pattern?month=YYYY-MM` | Spending by day of week |
| GET | `/analytics/income-vs-expense?months=6` | Income vs expense per month |
| GET | `/analytics/top-expenses?month=YYYY-MM` | Top expenses by amount |

---

## Architecture Overview

### Database Schema (New Models)

```
User ─┬─ Expense ──── ExpenseSplit
      │     └── ExpenseTag ── Tag
      ├─ Income
      ├─ Budget ── Notification
      ├─ RecurringExpense
      ├─ SavingsGoal
      ├─ Tag
      ├─ Category
      └─ Notification
```

### New Backend Modules

| Module | Directory | Purpose |
|--------|-----------|---------|
| Income | `server/src/income/` | Income CRUD + summary |
| Recurring | `server/src/recurring-expenses/` | Recurring expense CRUD + processing |
| Savings | `server/src/savings-goals/` | Goals CRUD + fund management |
| Notifications | `server/src/notifications/` | Alert system + budget checking |
| Tags | `server/src/tags/` | Tag CRUD + expense tagging |
| Export | `server/src/export/` | CSV download + report generation |

### New Frontend Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/income` | Income page | Track earnings |
| `/recurring` | Recurring page | Manage subscriptions |
| `/savings` | Savings page | Track financial goals |
| `/notifications` | Notifications page | View alerts |
| `/export` | Export page | Download data |
| `/settings` | Settings page | Profile & preferences |

---

## Setup After Pull

After pulling these changes:

```bash
# 1. Stop the dev server if running

# 2. Apply database migration
cd server
npx prisma migrate dev

# 3. Generate Prisma client
npx prisma generate

# 4. Start the server
npm run start:dev

# 5. Start the client
cd ../client
npm run dev
```

**For PWA icons**, create two PNG files:
- `client/public/icons/icon-192.png` (192x192 pixels)
- `client/public/icons/icon-512.png` (512x512 pixels)

Use your logo or any wallet/finance icon. These are required for the PWA install prompt.
