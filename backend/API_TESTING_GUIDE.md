# API Testing Guide - Invoice Management System

## 🚀 Base URL
```
http://localhost:5212
```
Swagger UI: `http://localhost:5212/swagger`

---

## 🔐 **AuthController**

### 1. Login
**Path**: `POST /api/Auth/login`
**Headers**: None
**Body**:
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```
**Expected Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👥 **UserController**

### 1. Register User
**Path**: `POST /api/User/register`
**Headers**: None
**Body**:
```json
{
  "username": "financeuser1",
  "password": "Finance@123",
  "role": "FinanceUser"
}
```
**Expected Response**:
```json
{
  "message": "User created successfully",
  "userId": 1,
  "username": "financeuser1",
  "role": "FinanceUser"
}
```

### 2. Get All Users (Admin Only)
**Path**: `GET /api/User`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Expected Response**:
```json
[
  {
    "id": 1,
    "username": "financeuser1",
    "role": "FinanceUser"
  }
]
```

---

## 📄 **InvoiceController** (Requires Authorization)

### 1. Create Invoice (FinanceUser/Admin)
**Path**: `POST /api/Invoice`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**:
```json
{
  "customerId": 1,
  "invoiceDate": "2024-04-01T10:00:00Z",
  "dueDate": "2024-05-01T10:00:00Z",
  "discountAmount": 100.00
}
```
**Expected Response**:
```json
{
  "invoiceId": 1,
  "customerId": 1,
  "invoiceDate": "2024-04-01T10:00:00Z",
  "dueDate": "2024-05-01T10:00:00Z",
  "status": "Draft",
  "subTotal": 0,
  "taxAmount": 0,
  "discountAmount": 100.00,
  "grandTotal": -100.00,
  "outstandingBalance": -100.00,
  "createdDate": "2024-04-01T10:00:00Z"
}
```

### 2. Get All Invoices
**Path**: `GET /api/Invoice`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Expected Response**:
```json
[
  {
    "invoiceId": 1,
    "customerId": 1,
    "invoiceDate": "2024-04-01T10:00:00Z",
    "dueDate": "2024-05-01T10:00:00Z",
    "status": "Draft",
    "subTotal": 0,
    "taxAmount": 0,
    "discountAmount": 100.00,
    "grandTotal": -100.00,
    "outstandingBalance": -100.00,
    "createdDate": "2024-04-01T10:00:00Z"
  }
]
```

### 3. Get Invoice by ID
**Path**: `GET /api/Invoice/{invoiceId}`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Expected Response**: Same as single invoice object

### 4. Get Invoices by Status
**Path**: `GET /api/Invoice/status/{status}`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Example**: `GET /api/Invoice/status/Draft`

### 5. Get Invoices by Customer
**Path**: `GET /api/Invoice/customer/{customerId}`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Example**: `GET /api/Invoice/customer/1`

### 6. Add Line Item to Invoice
**Path**: `POST /api/Invoice/{invoiceId}/items`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**:
```json
{
  "description": "Web Development Services",
  "quantity": 10,
  "unitPrice": 150.00,
  "discount": 50.00,
  "tax": 100.00
}
```
**Expected Response**: Updated invoice object

### 7. Get Line Items for Invoice
**Path**: `GET /api/Invoice/{invoiceId}/items`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Expected Response**:
```json
[
  {
    "lineItemId": 1,
    "invoiceId": 1,
    "description": "Web Development Services",
    "quantity": 10,
    "unitPrice": 150.00,
    "discount": 50.00,
    "tax": 100.00,
    "lineTotal": 1500.00
  }
]
```

### 8. Add Payment to Invoice (FinanceUser/Admin)
**Path**: `POST /api/Invoice/{invoiceId}/payments`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**:
```json
{
  "paymentAmount": 500.00,
  "paymentDate": "2024-04-15T10:00:00Z",
  "paymentMethod": "Bank Transfer",
  "referenceNumber": "TXN123456"
}
```
**Expected Response**: Updated invoice object

### 9. Get Payments for Invoice
**Path**: `GET /api/Invoice/{invoiceId}/payments`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Expected Response**:
```json
[
  {
    "paymentId": 1,
    "invoiceId": 1,
    "paymentAmount": 500.00,
    "paymentDate": "2024-04-15T10:00:00Z",
    "paymentMethod": "Bank Transfer",
    "referenceNumber": "TXN123456",
    "receivedDate": "2024-04-15T10:00:00Z"
  }
]
```

### 10. Get Invoice Summary
**Path**: `GET /api/Invoice/summary`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Expected Response**: Summary statistics object

### 11. Get Total Outstanding Balance
**Path**: `GET /api/Invoice/outstanding-total`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Expected Response**:
```json
{
  "totalOutstandingBalance": 1500.00
}
```

### 12. Delete Invoice (Admin Only)
**Path**: `DELETE /api/Invoice/{invoiceId}`
**Headers**: 
- `Authorization: Bearer {token}`
**Body**: None
**Expected Response**:
```json
"Invoice deleted successfully"
```

---

## 🧪 **Testing Sequence**

### Step 1: Create Users
```bash
# Create Admin User
POST /api/User/register
{
  "username": "admin",
  "password": "Admin@123",
  "role": "Admin"
}

# Create Finance User
POST /api/User/register
{
  "username": "finance1",
  "password": "Finance@123",
  "role": "FinanceUser"
}

# Create Regular User
POST /api/User/register
{
  "username": "user1",
  "password": "User@123",
  "role": "User"
}
```

### Step 2: Login and Get Token
```bash
POST /api/Auth/login
{
  "username": "finance1",
  "password": "Finance@123"
}
```
Copy the token from response.

### Step 3: Test Invoice Operations
```bash
# Create Invoice
POST /api/Invoice
Authorization: Bearer {token}
{
  "customerId": 1,
  "invoiceDate": "2024-04-01T10:00:00Z",
  "dueDate": "2024-05-01T10:00:00Z",
  "discountAmount": 0
}

# Add Line Items (repeat for multiple items)
POST /api/Invoice/1/items
Authorization: Bearer {token}
{
  "description": "Consulting Services",
  "quantity": 5,
  "unitPrice": 200.00,
  "discount": 0,
  "tax": 50.00
}

# Add Payment
POST /api/Invoice/1/payments
Authorization: Bearer {token}
{
  "paymentAmount": 500.00,
  "paymentDate": "2024-04-15T10:00:00Z",
  "paymentMethod": "Credit Card",
  "referenceNumber": "CC123456"
}
```

### Step 4: Test Query Operations
```bash
# Get All Invoices
GET /api/Invoice
Authorization: Bearer {token}

# Get Invoice by ID
GET /api/Invoice/1
Authorization: Bearer {token}

# Get Invoice Summary
GET /api/Invoice/summary
Authorization: Bearer {token}
```

---

## 🔍 **Expected Behaviors**

### **Authentication**
- ✅ Login returns JWT token
- ✅ Token required for Invoice endpoints
- ✅ Role-based access control enforced

### **Caching**
- ✅ First request hits database
- ✅ Subsequent requests use Redis cache
- ✅ Write operations invalidate cache

### **Business Rules**
- ✅ DueDate must be greater than InvoiceDate
- ✅ Cannot modify paid invoices
- ✅ Payment cannot exceed outstanding balance
- ✅ Only Admin can delete invoices
- ✅ Only FinanceUser/Admin can create invoices

### **Error Handling**
- ✅ 401 Unauthorized for missing/invalid token
- ✅ 403 Forbidden for insufficient permissions
- ✅ 400 Bad Request for validation errors
- ✅ 404 Not Found for missing resources

---

## 🛠 **Testing Tools**

### **Postman Collection**
Import this collection for easy testing:
```json
{
  "info": {
    "name": "Invoice Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5212"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

### **cURL Examples**
```bash
# Login
curl -X POST "http://localhost:5212/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"finance1","password":"Finance@123"}'

# Create Invoice
curl -X POST "http://localhost:5212/api/Invoice" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"customerId":1,"invoiceDate":"2024-04-01T10:00:00Z","dueDate":"2024-05-01T10:00:00Z","discountAmount":0}'
```

---

## 📊 **Performance Testing**

### **Cache Performance**
1. **First Request**: Database hit + Cache storage
2. **Second Request**: Cache hit (sub-millisecond)
3. **After Write**: Cache invalidation + rebuild

### **Monitor Redis**
```bash
docker exec -it {redis_container_id} redis-cli monitor
```

### **Expected Performance**
- **Cache Hit Rate**: 80-95% after warmup
- **Response Time**: < 50ms for cached data
- **Database Load**: 60-80% reduction

---

## 🎯 **Success Criteria**

✅ **All endpoints respond correctly**  
✅ **Authentication and authorization working**  
✅ **Caching improves performance**  
✅ **Business rules enforced**  
✅ **Error handling comprehensive**  
✅ **Redis integration functional**  

Your Invoice Management API is ready for production testing! 🚀
