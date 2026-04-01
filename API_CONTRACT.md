# API Contract

Base URL: `http://localhost:5000` (or value from frontend `VITE_API_URL`)

Auth: JWT Bearer token required for all endpoints except login and register.

Content type: `application/json`

## Standard Shapes

### Invoice object (response)

```json
{
  "invoiceId": 0,
  "invoiceNumber": "INV-2026-0001",
  "customerId": 0,
  "invoiceDate": "2026-04-01T00:00:00Z",
  "dueDate": "2026-04-15T00:00:00Z",
  "status": "Draft",
  "subTotal": 0.0,
  "taxAmount": 0.0,
  "discountAmount": 0.0,
  "grandTotal": 0.0,
  "outstandingBalance": 0.0,
  "createdDate": "2026-04-01T12:00:00Z",
  "lineItems": [],
  "payments": []
}
```

### Line item object (response)

```json
{
  "lineItemId": 0,
  "invoiceId": 0,
  "description": "Service charge",
  "quantity": 1,
  "unitPrice": 100.0,
  "discount": 0.0,
  "tax": 18.0,
  "lineTotal": 118.0
}
```

### Payment object (response)

```json
{
  "paymentId": 0,
  "invoiceId": 0,
  "paymentAmount": 50.0,
  "paymentDate": "2026-04-01T00:00:00Z",
  "paymentMethod": "BankTransfer",
  "referenceNumber": "TXN-001",
  "receivedDate": "2026-04-01T12:00:00Z"
}
```

### Error shape

Current backend mostly returns plain string messages for errors:

```json
"DueDate must be greater than InvoiceDate"
```

HTTP codes currently used:
- `400` validation/business rule errors
- `401` unauthorized/invalid login
- `404` resource not found (for some GET routes)
- `403` forbidden (role protected routes)

---

## 1) Authentication

### POST `/api/auth/login`
- **Auth:** No
- **Request body:**
```json
{
  "username": "admin",
  "password": "secret"
}
```
- **Query params:** None
- **Success response (200):**
```json
{
  "token": "jwt-token"
}
```
- **Error response:** `401` with message string

### POST `/api/user/register`
- **Auth:** No
- **Request body:**
```json
{
  "username": "newuser",
  "password": "secret",
  "role": "FinanceUser"
}
```
- **Query params:** None
- **Success response (200):**
```json
{
  "message": "User created successfully",
  "userId": 1,
  "username": "newuser",
  "role": "FinanceUser"
}
```
- **Error response:** `400` with message string

---

## 2) Invoice CRUD

### GET `/api/invoices`
- **Auth:** Yes
- **Query params:**
  - `page` (optional, default `1`)
  - `pageSize` (optional, default `20`, max `100`)
- **Request body:** None
- **Success response (200):** `Invoice[]`
- **Error response:** `400` with message string

### GET `/api/invoices/{invoiceId}`
- **Auth:** Yes
- **Path params:** `invoiceId` (int)
- **Request body:** None
- **Query params:** None
- **Success response (200):** `Invoice`
- **Error response:** `404` if not found, otherwise `400` with message string

### POST `/api/invoices`
- **Auth:** Yes (`FinanceUser`, `Admin`)
- **Request body:**
```json
{
  "customerId": 101,
  "invoiceDate": "2026-04-01T00:00:00Z",
  "dueDate": "2026-04-15T00:00:00Z",
  "discountAmount": 0.0
}
```
- **Query params:** None
- **Success response (200):** `Invoice`
- **Error response:** `400` with message string

### PUT `/api/invoices/{invoiceId}`
- **Auth:** Yes (`FinanceUser`, `Admin`)
- **Path params:** `invoiceId` (int)
- **Request body:**
```json
{
  "customerId": 101,
  "invoiceDate": "2026-04-01T00:00:00Z",
  "dueDate": "2026-04-20T00:00:00Z",
  "discountAmount": 50.0
}
```
- **Query params:** None
- **Success response (200):** `Invoice`
- **Error response:** `400` with message string

### DELETE `/api/invoices/{invoiceId}`
- **Auth:** Yes (`Admin`)
- **Path params:** `invoiceId` (int)
- **Request body:** None
- **Query params:** None
- **Success response (200):**
```json
"Invoice deleted successfully"
```
- **Error response:** `400` with message string

### PATCH `/api/invoices/{invoiceId}/status`
- **Auth:** Yes (`FinanceManager`, `Admin`)
- **Path params:** `invoiceId` (int)
- **Request body:**
```json
{
  "status": "Sent"
}
```
- **Query params:** None
- **Success response (200):** `Invoice`
- **Error response:** `400` with message string

---

## 3) Line Item Management

### GET `/api/invoices/{invoiceId}/items`
- **Auth:** Yes
- **Path params:** `invoiceId` (int)
- **Request body:** None
- **Query params:** None
- **Success response (200):** `InvoiceLineItem[]`
- **Error response:** `400` with message string

### POST `/api/invoices/{invoiceId}/items`
- **Auth:** Yes (current backend allows authenticated users)
- **Path params:** `invoiceId` (int)
- **Request body:**
```json
{
  "description": "Consulting hours",
  "quantity": 2,
  "unitPrice": 1000.0,
  "discount": 50.0,
  "tax": 180.0
}
```
- **Query params:** None
- **Success response (200):** `Invoice` (updated)
- **Error response:** `400` with message string

### PUT `/api/invoices/{invoiceId}/items/{itemId}`
- **Auth:** Yes (`FinanceUser`, `Admin`)
- **Path params:** `invoiceId` (int), `itemId` (int)
- **Request body:** same shape as add item
- **Query params:** None
- **Success response (200):** `Invoice` (updated)
- **Error response:** `400` with message string

### DELETE `/api/invoices/{invoiceId}/items/{itemId}`
- **Auth:** Yes (`FinanceUser`, `Admin`)
- **Path params:** `invoiceId` (int), `itemId` (int)
- **Request body:** None
- **Query params:** None
- **Success response (200):** `Invoice` (updated)
- **Error response:** `400` with message string

---

## 4) Payment Tracking

### GET `/api/invoices/{invoiceId}/payments`
- **Auth:** Yes
- **Path params:** `invoiceId` (int)
- **Request body:** None
- **Query params:** None
- **Success response (200):** `Payment[]`
- **Error response:** `400` with message string

### POST `/api/invoices/{invoiceId}/payments`
- **Auth:** Yes (`FinanceUser`, `Admin`)
- **Path params:** `invoiceId` (int)
- **Request body:**
```json
{
  "paymentAmount": 500.0,
  "paymentDate": "2026-04-01T00:00:00Z",
  "paymentMethod": "BankTransfer",
  "referenceNumber": "TXN-12345"
}
```
- **Query params:** None
- **Success response (200):** `Invoice` (updated)
- **Error response:** `400` with message string

---

## 5) Analytics (Redis cached, 5 minutes)

### GET `/api/invoices/analytics/aging`
- **Auth:** Yes (`FinanceManager`, `Admin`)
- **Request body:** None
- **Query params:** None
- **Success response (200):**
```json
{
  "current": 0.0,
  "overdue1To30Days": 0.0,
  "overdue31To60Days": 0.0,
  "overdue60PlusDays": 0.0
}
```
- **Error response:** `400` with message string

### GET `/api/invoices/analytics/revenue-summary`
- **Auth:** Yes (`FinanceManager`, `Admin`)
- **Request body:** None
- **Query params:** None
- **Success response (200):**
```json
{
  "totalRevenue": 0.0,
  "totalCollected": 0.0,
  "totalOutstanding": 0.0,
  "invoiceCount": 0
}
```
- **Error response:** `400` with message string

### GET `/api/invoices/analytics/dso`
- **Auth:** Yes (`FinanceManager`, `Admin`)
- **Request body:** None
- **Query params:**
  - `days` (optional, default `30`)
- **Success response (200):**
```json
{
  "days": 30,
  "dso": 0.0
}
```
- **Error response:** `400` with message string

### GET `/api/invoices/analytics/outstanding`
- **Auth:** Yes (`FinanceManager`, `Admin`)
- **Request body:** None
- **Query params:** None
- **Success response (200):**
```json
{
  "totalOutstanding": 0.0,
  "openInvoiceCount": 0
}
```
- **Error response:** `400` with message string

---

## 6) Frontend API Service Mapping

`frontend/invoice-management-ui/src/api/invoiceApi.js` maps to:

- `getAll(params)` -> `GET /api/invoices`
- `getById(id)` -> `GET /api/invoices/{id}`
- `create(data)` -> `POST /api/invoices`
- `update(id, data)` -> `PUT /api/invoices/{id}`
- `delete(id)` -> `DELETE /api/invoices/{id}`
- `changeStatus(id, status)` -> `PATCH /api/invoices/{id}/status`
- `getItems(invoiceId)` -> `GET /api/invoices/{invoiceId}/items`
- `addItem(invoiceId, data)` -> `POST /api/invoices/{invoiceId}/items`
- `updateItem(invoiceId, itemId, data)` -> `PUT /api/invoices/{invoiceId}/items/{itemId}`
- `deleteItem(invoiceId, itemId)` -> `DELETE /api/invoices/{invoiceId}/items/{itemId}`
- `getPayments(invoiceId)` -> `GET /api/invoices/{invoiceId}/payments`
- `addPayment(invoiceId, data)` -> `POST /api/invoices/{invoiceId}/payments`
- `getAging()` -> `GET /api/invoices/analytics/aging`
- `getRevenueSummary()` -> `GET /api/invoices/analytics/revenue-summary`
- `getDso()` -> `GET /api/invoices/analytics/dso`
- `getOutstanding()` -> `GET /api/invoices/analytics/outstanding`

