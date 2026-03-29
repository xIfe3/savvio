# Expense Tracker

A full-stack web-based expense management application built to help users track spending, manage budgets, and gain financial insights through clear visualizations.

## Tech Stack

### Frontend (Client)
- **Next.js 15** — React framework with App Router
- **React 19** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Utility-first styling
- **Recharts** — Charts and data visualizations (bar, pie, area charts)
- **Lucide React** — Icon library
- **date-fns** — Date formatting utilities

### Backend (Server)
- **NestJS 11** — Node.js backend framework
- **Prisma 6** — ORM for database access
- **SQLite** — Lightweight relational database
- **Passport.js + JWT** — Authentication with JSON Web Tokens
- **bcrypt** — Secure password hashing
- **class-validator** — DTO validation and input sanitization

## Features

### Authentication
- User registration with email and password
- Login with JWT-based session management
- Protected routes requiring authentication
- Secure password storage with bcrypt hashing

### Expense Tracking
- Add, edit, and delete expenses
- Categorize expenses into predefined or custom categories
- Search and filter expenses by description, category, and date range
- Paginated expense listing sorted by date

### Budget Management
- Set monthly budgets per category
- Track spending against budget limits with progress bars
- Visual warnings when approaching or exceeding budget limits
- Navigate between months to compare budgets over time

### Categories
- 10 preseeded default categories (Food & Dining, Transportation, Housing, Utilities, Entertainment, Shopping, Healthcare, Education, Savings, Other)
- Create custom categories with name and color
- Edit and delete user-created categories

### Analytics Dashboard
- **Summary cards** — Total spending, transaction count, and month-over-month change percentage
- **Daily spending chart** — Area chart showing spending patterns across the month
- **Category breakdown** — Pie chart with percentage distribution across categories
- **Monthly trend** — Bar chart comparing total spending over the last 6 months
- **Recent expenses** — Quick view of the 5 most recent transactions

## Project Structure

```
expense-tracker/
├── client/                    # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          # Root layout with AuthProvider
│       │   ├── page.tsx            # Redirect to dashboard or login
│       │   ├── login/page.tsx      # Login page
│       │   ├── register/page.tsx   # Registration page
│       │   └── (app)/              # Protected app routes
│       │       ├── layout.tsx      # Sidebar + auth guard
│       │       ├── dashboard/      # Dashboard with charts
│       │       ├── expenses/       # Expense management
│       │       ├── budgets/        # Budget management
│       │       └── categories/     # Category management
│       ├── components/
│       │   └── sidebar.tsx         # Navigation sidebar
│       └── lib/
│           ├── api.ts              # API client for all endpoints
│           ├── auth-context.tsx    # Authentication context provider
│           └── utils.ts            # Formatting helpers
│
├── server/                    # NestJS backend
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── seed.ts                 # Default category seeder
│   └── src/
│       ├── main.ts                 # App bootstrap (CORS, validation)
│       ├── app.module.ts           # Root module
│       ├── prisma/                 # Prisma service (global)
│       ├── auth/                   # Auth module
│       │   ├── auth.controller.ts  # Register, login, profile
│       │   ├── auth.service.ts     # Auth business logic
│       │   ├── jwt.strategy.ts     # JWT passport strategy
│       │   ├── jwt-auth.guard.ts   # Route guard
│       │   ├── user.decorator.ts   # @CurrentUser() decorator
│       │   └── dto/                # Request validation DTOs
│       ├── expenses/               # Expenses CRUD module
│       ├── budgets/                # Budgets CRUD module
│       ├── categories/             # Categories CRUD module
│       └── analytics/              # Analytics and reporting module
│
└── README.md
```

## Database Schema

| Model    | Description                                                   |
|----------|---------------------------------------------------------------|
| User     | Stores user credentials (email, hashed password, name)        |
| Category | Expense categories with color and icon, supports user-custom  |
| Expense  | Individual expense records linked to a user and category      |
| Budget   | Monthly budget limits per category per user                   |

## API Endpoints

### Auth
| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| POST   | /auth/register    | Create a new account     |
| POST   | /auth/login       | Sign in and receive JWT  |
| GET    | /auth/profile     | Get current user profile |

### Expenses
| Method | Endpoint       | Description                        |
|--------|----------------|------------------------------------|
| GET    | /expenses      | List expenses (filter, search, paginate) |
| GET    | /expenses/:id  | Get a single expense               |
| POST   | /expenses      | Create a new expense               |
| PATCH  | /expenses/:id  | Update an expense                  |
| DELETE | /expenses/:id  | Delete an expense                  |

### Budgets
| Method | Endpoint      | Description                           |
|--------|---------------|---------------------------------------|
| GET    | /budgets      | List budgets (optional month filter)  |
| POST   | /budgets      | Create or update a budget             |
| PATCH  | /budgets/:id  | Update budget amount                  |
| DELETE | /budgets/:id  | Delete a budget                       |

### Categories
| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | /categories      | List all categories      |
| POST   | /categories      | Create a custom category |
| PATCH  | /categories/:id  | Update a category        |
| DELETE | /categories/:id  | Delete a category        |

### Analytics
| Method | Endpoint             | Description                         |
|--------|----------------------|-------------------------------------|
| GET    | /analytics/summary   | Dashboard summary for a month       |
| GET    | /analytics/categories| Category spending breakdown         |
| GET    | /analytics/trend     | Monthly spending trend (6 months)   |
| GET    | /analytics/daily     | Daily spending for a month          |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install server dependencies
cd server
npm install

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Install client dependencies
cd ../client
npm install
```

### Running the Application

```bash
# Terminal 1 — Start the backend (port 3001)
cd server
npm run start:dev

# Terminal 2 — Start the frontend (port 3000)
cd client
npm run dev
```

Visit **http://localhost:3000** in your browser, create an account, and start tracking your expenses.

## Security and Privacy

- Passwords are hashed with bcrypt before storage
- JWT tokens expire after 7 days
- All API inputs are validated and sanitized using class-validator
- CORS is configured to only allow requests from the frontend origin
- Global validation pipe strips unknown properties from requests
- SQLite database stored locally — no external data sharing
- Manual expense entry by design — no bank account linking required

## Design Rationale

This application was designed based on research findings from the literature review covering behavioural economics, financial capability, and HCI best practices:

- **Low-friction data capture** — Streamlined manual entry with pre-populated date fields and dropdown category selection reduces the cognitive burden of expense recording
- **Meaningful visualizations** — Charts compare spending against budgets, show category distributions, and display trends over time, making abstract spending patterns tangible
- **Progressive disclosure** — Simple default experience with optional advanced features (custom categories, detailed analytics) for users who want more control
- **Privacy-preserving defaults** — Manual entry approach avoids bank API integration, minimizing data collection to only what is needed
- **Transparency** — Budget progress bars, percentage changes, and category breakdowns make automated calculations visible and understandable
- **User control** — All categorizations can be manually set or corrected, supporting user agency rather than opaque automation
