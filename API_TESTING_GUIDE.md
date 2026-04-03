# 🎤 QA & Testing Demonstration Script: Invoice Management System

**Role**: QA / Tester
**Audience**: Clients, Stakeholders, or Project Managers
**Goal**: Demonstrate that the frontend and backend are interconnected, secured, and thoroughly tested.

---

## 🕒 Phase 1: Environment Setup & Start (Live Execution)

*(Start speaking and open your terminals. Ensure Docker (MySQL & Redis) is already running in the background).*

**"Hello everyone. Today I'll be demonstrating the testing and quality assurance measures we've implemented for our Invoice Management System. I'll start by bringing up our backend and frontend servers live."**

### 1. Start the Frontend Server
*(Open Terminal 1)*
```powershell
PS E:\github> cd P2_Invoice_Management\frontend\invoice-management-ui
PS E:\github\P2_Invoice_Management\frontend\invoice-management-ui> npm run dev
```
**Talking Point:** "Here we are navigating into our React frontend directory and starting the Vite development server."

### 2. Start the Backend API Server
*(Open Terminal 2)*
```powershell
PS E:\github> cd P2_Invoice_Management\backend\P2_Invoice_Management
PS E:\github\P2_Invoice_Management\backend\P2_Invoice_Management> dotnet run
```
**Talking Point:** "In this second terminal, I'm navigating to our .NET 8 backend and launching the API. This will connect to our MySQL database and active Redis cache."

---

## 💻 Phase 2: Automated Unit Testing Demonstration

*(Open a 3rd Terminal or stop the backend briefly if needed, but a 3rd terminal is best)*

**"Before we test the live application, we enforce strict business rules via automated unit tests. Our test suites cover critical financial logic, like making sure tax is calculated accurately and preventing overpayments."**

### Execute the Core Tests
*(In Terminal 3, navigate to the test directory)*
```powershell
PS E:\github> cd P2_Invoice_Management\backend\P2_Invoice_Management\Tests
PS E:\github\P2_Invoice_Management\backend\P2_Invoice_Management\Tests> dotnet test
```

**Talking Point during execution:**
- "As the tests run, you can see xUnit validating our CQRS Handlers and Repository connections using Mock data."
- "Notice the 'Passed' indicators. This guarantees our core calculation engine is mathematically perfect before any user interacts with the system."

---

## 🌐 Phase 3: Live API & Security Testing via Swagger

*(Open browser to `http://localhost:5212/swagger`)*

**"Now let's interact with the live API. Security is a primary focus. We use stateless JWT tokens for role-based authorization."**

### 1. Test Unauthorized Access (Security Check)
- **Action**: Try to execute the `GET /api/Invoice` endpoint without logging in.
- **Talking Point**: "If an attacker tries to query our financial data without a valid token, the system blocks them immediately with a 401 Unauthorized status. Let's see that live..." *(Show the 401 error)*.

### 2. Login as a Finance User
- **Action**: Go to `POST /api/Auth/login` and input valid credentials.
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```
- **Talking Point**: "I'm going to generate an authentication token by logging in. Once authenticated, the server grants me a secure JWT token."
- **Action**: Copy the token, click "Authorize" at the top of Swagger, and paste it.

### 3. Test Business Logic Edge Cases
- **Action**: Go to the `POST /api/Invoice/{invoiceId}/payments` endpoint. Attempt to pay more money than is owed on an invoice.
- **Talking Point**: "Let's try to break the business logic. I will attempt to make a $1,000 payment on an invoice that only has a $500 outstanding balance."
- *(Execute request)* "Notice how the API immediately throws an error rejecting the overpayment. The integrity of our financial state is protected by the API layer."

---

## 📱 Phase 4: Frontend UI / End-to-End Testing

*(Open browser to the Frontend UI: `http://localhost:5173`)*

**"Finally, we conduct End-to-End testing from the perspective of the end user utilizing our React UI."**

### 1. Login Authentication Flow
- **Action**: Log into the web interface.
- **Talking Point**: "The frontend securely stores our JWT token and attaches it automatically to every subsequent internal request."

### 2. Data Validation & Input Handling
- **Action**: Navigate to 'Create Invoice'. Add some items but leave the 'Customer' or 'Due Date' empty, then try to submit.
- **Talking Point**: "If our users make a typo or forget a requirement, the frontend intercepts the request before it even reaches the server. Notice these error highlights letting the user know they are missing required fields."

### 3. Live Calculation Engine
- **Action**: Fill out a valid invoice and add a Line Item. Change the 'Quantity' and 'Price'.
- **Talking Point**: "Watch the Subtotal and Grand Total dynamically calculate in real-time on the page. Even though the frontend calculates this for User Experience, the backend will still recalculate and verify these numbers upon submission to prevent tampering."

---

## 🎯 Phase 5: Conclusion

**"To conclude our testing demonstration:**
1. Our **Frontend** validates user input dynamically.
2. Our **API** securely enforces role-based access and strict business rules.
3. Our **Automated Tests** mathematically verify that everything works correctly behind the scenes.

**Are there any specific components, endpoints, or error states you would like me to test live right now?"**
