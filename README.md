# InvoiceOS — Modern Invoice Management System

InvoiceOS is a high-performance, full-stack financial invoicing system designed for stability, speed, and strict role-based access control.

---

## 🚀 Recent Performance Updates
- **Dashboard Optimization**: Reduced main dashboard payload by 99% using dedicated summary APIs.
- **Cache Resilience**: Implemented a "Circuit Breaker" for Redis. If Redis is down, the system immediately falls back to Memory Cache without hanging on 5-second timeouts.
- **Sync Fixes**: Resolved race conditions in the Auth flow and fixed internal navigation cache invalidation.

---

## 🛠️ Technology Stack

### **Backend**
- **Framework**: ASP.NET Core 8.0 Web API
- **ORM**: Entity Framework Core with SQL Server
- **Caching**: StackExchange.Redis with a custom `FallbackCacheService` (Memory Cache fallback)
- **Architecture**: CQRS (Command Query Responsibility Segregation) with Scoped Services
- **Auth**: JWT (JSON Web Token) with claim-based Role verification

### **Frontend**
- **Framework**: React 18 (Vite)
- **State Management**: Context API (Auth)
- **Styling**: Premium Vanilla CSS (Rich aesthetics, dark mode, responsive)
- **API Client**: Axios with interceptors for JWT injection

---

## 📂 Project Structure & File Trace

```text
root/
├── backend/P2_Invoice_Management/
│   ├── Controllers/             # REST API Endpoints (Invoice, User)
│   ├── Data/                     # EF Core Context & Migrations
│   ├── Models/                   # Domain Entities & DTOs
│   ├── Services/
│   │   ├── Commands/             # Write Logic (Cache-aware)
│   │   ├── Queries/              # Read Logic (Cache-aware)
│   │   └── FallbackCacheService.cs # Redis/Memory Hybrid logic
│   └── Program.cs                # Entry point & DI Configuration
└── frontend/invoice-management-ui/
    ├── src/
    │   ├── api/                  # Axios Clients & Interceptors
    │   ├── context/              # Auth & JWT Management
    │   ├── pages/                # All Dashboard/Analytics UI
    │   ├── index.css             # Design System & Dark Mode
    │   └── App.jsx               # Routing & Global Layout
    └── vite.config.js            # Build Configuration
```

### **Backend File Trace (`/backend`)**
- **`Program.cs`**: The application heart. Configures Dependency Injection (DI), Authentication (JWT), CORS, and the Caching pipeline.
- **`Data/AppDbContext.cs`**: Entity Framework setup; maps C# models (Invoice, Payment, User) to SQL Server tables.
- **`Controllers/InvoiceController.cs`**: Handles all API requests for invoices, analytics, and summary data.
- **`Services/Queries/CachedInvoiceQueryService.cs`**: Implements "Read" logic. It checks Redis/Memory cache before hitting the database.
- **`Services/Commands/CachedInvoiceCommandService.cs`**: Implements "Write" logic. It updates the database and **invalidates** affected cache keys.
- **`Services/FallbackCacheService.cs`**: Implements the "Circuit Breaker" pattern for Redis vs. Memory Cache.

### **Frontend File Trace (`/frontend`)**
- **`src/App.jsx`**: Defines the application skeleton, sidebar layout, and all route-guards (RBAC).
- **`src/context/AuthContext.jsx`**: Manages the global login state. Decodes JWTs synchronously to prevent "flashing" or navigation race conditions.
- **`src/api/invoiceApi.js`**: A centralized hub for all API calls (Invoices, Payments, Analytics, Summary).
- **`src/pages/Invoices/DashboardPage.jsx`**: The main hub. Uses the "Summary API" for high-performance stat rendering.
- **`src/index.css`**: The core design system; contains all theme tokens (dark mode), animations, and responsive utilities.

---

## 🔐 Verified Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Finance Manager** | `manager` | `manager123` |
| **Finance User** | `user` | `user123` |

----

## ⚙️ Setup & Installation

### **1. Backend Setup**
1. Ensure **SQL Server** is running.
2. Update the connection string in `backend/P2_Invoice_Management/appsettings.json`.
3. (Optional) Start Redis: `docker run -p 6379:6379 -d redis`.
4. Run the API:
   ```bash
   cd backend/P2_Invoice_Management
   dotnet run
   ```
   *API will be available at http://localhost:5000*

### **2. Frontend Setup**
1. Install dependencies:
   ```bash
   cd frontend/invoice-management-ui
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
   *Dashboard will be available at http://localhost:3000*

---

## Features

- ✅ **Strict RBAC**: Full access control for Finance Users, Managers, and Admins.
- ✅ **Optimized Dashboard**: Real-time stats (Outstanding, Overdue, Paid) computed efficiently via summary endpoints.
- ✅ **Caching Strategy**: Redis-first architecture with automatic failover to local memory if Redis is unavailable.
- ✅ **Audit Ready**: Auto-generated invoice numbers (INV-YYYY-XXXX) and payment tracking.
- ✅ **Modern UI**: Full dark-mode theme with micro-animations and responsive layouts.
- ✅ **Docker Ready**: Containers for all services including persistent SQL volumes and Redis.

---

## 📊 Analytics
- **Aging Report**: Automatic categorization of overdue invoices (1-30, 31-60, 60+ days).
- **Revenue Summary**: Real-time tracking of total invoiced vs. total collected revenue.
- **DSO Tracking**: Days Sales Outstanding calculation for financial health monitoring.

==========================================================================
