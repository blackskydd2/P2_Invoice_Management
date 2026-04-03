# InvoiceOS — Modern Invoice Management System

InvoiceOS is a high-performance, full-stack invoice management platform designed for scalability, reliability, and strict role-based access control.

It enables businesses to manage invoices, payments, analytics, and users efficiently with a robust backend and a responsive frontend.

---

## 🚀 Key Features

### 📄 Invoice Management
- Create, update, and delete invoices
- Add multiple line items per invoice
- Track invoice status (Pending, Paid, Overdue)

### 💳 Payments
- Record partial and full payments
- Track payment history per invoice

### 📊 Analytics Dashboard
- Revenue insights
- Aging reports
- Optimized summary APIs for fast load times

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Secure API endpoints

### ⚡ Performance & Reliability
- Redis caching with automatic fallback to in-memory cache
- Circuit breaker pattern for cache resilience
- CQRS architecture for scalable read/write separation

---

## 🛠️ Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0 Web API
- **ORM**: Entity Framework Core
- **Database**: SQL Server
- **Caching**: Redis + Memory Cache (Fallback)
- **Architecture**: CQRS (Command Query Responsibility Segregation)
- **Authentication**: JWT (JSON Web Tokens)

### Frontend
- **Framework**: React 18 (Vite)
- **State Management**: Context API
- **HTTP Client**: Axios (with interceptors)
- **Styling**: Custom CSS (responsive + dark mode)

### DevOps
- Docker & Docker Compose
- Nginx (frontend serving)

---

## 📁 Project Structure
<<<<<<< HEAD

```
P2_Invoice_Management/
├── backend/
│   ├── Controllers/        # API endpoints
│   ├── Models/             # Domain models
│   ├── Dtos/               # Data transfer objects
│   ├── Services/
│   │   ├── Commands/       # Write operations (CQRS)
│   │   ├── Queries/        # Read operations (CQRS)
│   │   └── Cache Services  # Redis + fallback logic
│   ├── Data/               # DbContext & migrations
│   └── Program.cs          # App entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── tests/
│   └── vite.config.js
│
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Setup Instructions

### 🔧 Prerequisites
- .NET 8 SDK
- Node.js (>= 18)
- SQL Server
- Redis (optional but recommended)
- Docker (optional)

---

### 🖥️ Backend Setup

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run

Backend runs on:
http://localhost:5000

💻 Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs on:
http://localhost:5173

🐳 Docker Setup (Full Stack)
docker-compose up --build


🔑 Environment Variables
Backend (appsettings.json or .env)
ConnectionStrings__DefaultConnection
Jwt__Key
Redis__ConnectionString
Frontend (.env)
VITE_API_BASE_URL

🧪 Testing
Backend Tests:
dotnet test

Frontend Tests:
npm run test

📡 API Overview

Detailed API contracts are available in:
API_CONTRACT.md

Key endpoints:
/api/auth → Login/Register
/api/invoice → Invoice operations
/api/user → User management

⚡ Performance Optimizations
99% reduction in dashboard payload via summary APIs
Redis caching with fallback to memory cache
Eliminated blocking calls using circuit breaker pattern
Fixed race conditions in authentication flow

🔒 Security
JWT-based authentication
Role-based authorization
Secure API routing
Input validation via DTOs

📌 Future Enhancements
Email notifications for invoices
PDF invoice generation
Multi-tenant support
Advanced reporting & exports

🤝 Contribution
Fork the repository
Create a feature branch
Commit your changes
Submit a pull request