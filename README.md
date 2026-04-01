# InvoiceOS — Invoice Management System

Full-stack financial invoicing system built with React + ASP.NET Core 8 + SQL Server + Redis.

---

## Project Structure

```
InvoiceManagement/
├── frontend/
│   └── invoice-management-ui/     ← React SPA (Vite)
│       ├── src/
│       │   ├── api/               ← Axios API clients
│       │   ├── components/        ← Layout & Shared components
│       │   ├── context/           ← AuthContext (JWT)
│       │   ├── pages/             ← All page components
│       │   │   ├── Auth/          ← Login, Unauthorized
│       │   │   ├── Invoices/      ← Dashboard, List, Create, Detail
│       │   │   ├── Payments/      ← Add Payment
│       │   │   └── Analytics/     ← Aging, Revenue dashboards
│       │   └── tests/             ← Vitest test suite
│       ├── Dockerfile
│       └── nginx.conf
├── backend/                       ← (To be built in Weeks 4-7)
│   └── src/
│       ├── InvoiceManagement.API/
│       ├── InvoiceManagement.Application/
│       ├── InvoiceManagement.Domain/
│       └── InvoiceManagement.Infrastructure/
└── docker-compose.yml
```

---

## Frontend Setup (Local Dev)

```bash
cd frontend/invoice-management-ui

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:5000)
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

App runs at **http://localhost:3000**

---

## Docker (Full Stack)

```bash
# From project root
docker-compose up --build
```

| Service        | URL                     |
|----------------|-------------------------|
| React Frontend | http://localhost:3000   |
| .NET API       | http://localhost:5000   |
| SQL Server     | localhost:1433          |
| Redis          | localhost:6379          |

---

## Pages

| Route                      | Page                  | Role Required          |
|----------------------------|-----------------------|------------------------|
| `/login`                   | Login                 | Public                 |
| `/dashboard`               | Dashboard             | Any authenticated      |
| `/invoices`                | Invoice List          | Any authenticated      |
| `/invoices/create`         | Create Invoice        | Any authenticated      |
| `/invoices/:id`            | Invoice Detail        | Any authenticated      |
| `/invoices/:id/payment`    | Add Payment           | Any authenticated      |
| `/analytics/aging`         | Aging Report          | FinanceManager / Admin |
| `/analytics/revenue`       | Revenue Dashboard     | FinanceManager / Admin |

---

## Roles

| Role            | Permissions                                                    |
|-----------------|----------------------------------------------------------------|
| `FinanceUser`   | Create invoices, add payments, view invoices                   |
| `FinanceManager`| All above + view analytics, modify invoice status             |
| `Admin`         | Full access including delete                                   |

---

## Features

- ✅ JWT authentication with role-based access control
- ✅ Invoice CRUD with auto-generated invoice numbers (INV-YYYY-0001)
- ✅ Dynamic line items with real-time total calculation
- ✅ Payment tracking with overpayment prevention
- ✅ Overdue invoice highlighting in red
- ✅ Aging report with bucket breakdown (Current / 1-30 / 31-60 / 60+)
- ✅ Revenue dashboard with collection rate
- ✅ Controlled forms with validation
- ✅ Loading & error states throughout
- ✅ Fully responsive design
- ✅ Docker-ready with Nginx SPA serving

---

## Testing

```bash
npm run test
```

Covers:
- Line item calculation
- Grand total with discounts
- Payment overpayment prevention
- Outstanding balance calculation
- Status auto-update logic
- DSO calculation
- Invoice number format validation
- Date validation
- StatusBadge component rendering
