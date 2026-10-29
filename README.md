# Mogali Footwear — Customer Loyalty Management System
### B.Tech DBMS Course Project

A retail customer loyalty and purchase management system designed for **Mogali Footwear** stores. Built with the **MERN** stack (MongoDB, Express.js, React + Vite, Node.js).

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (v6.0 or higher running locally on port 27017, or a MongoDB Atlas connection URI)

### 2. MongoDB Configuration
Create or verify `backend/.env`:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/mogali_footwear
```

### 3. Backend Setup & Run
```bash
cd backend
npm install

# Seed starter customers and sample retail purchases:
npm run seed

# Start the Express API server:
npm start
```
* Backend runs at: `http://localhost:5001`
* Health Check: `http://localhost:5001/api/health`

### 4. Frontend Setup & Run
Open a separate terminal:
```bash
cd frontend
npm install

# Start the Vite development server:
npm run dev
```
* Frontend runs at: `http://localhost:3000`

---

## 🗄️ Database Collections & Schema Design

### 1. `customers` Collection
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated unique customer ID |
| `name` | String | Required, trim (min 2 chars) | Customer full name |
| `phone` | String | Required, Unique, Indexed | Normalized 10-digit mobile number (`[6-9]\d{9}`) |
| `email` | String | Optional, trim | Customer email address |
| `totalQualifyingPurchases` | Number | Default: 0 | Cumulative lifetime completed purchases |
| `qualifyingPurchasesInCycle` | Number | Default: 0, range 0–5 | Progress towards next reward discount |
| `rewardAvailable` | Boolean | Default: false | True when customer earns 10% discount on next order |
| `rewardCyclesCompleted` | Number | Default: 0 | Total loyalty discount cycles redeemed |
| `totalSpent` | Number | Default: 0 | Total INR (₹) net spend |
| `loyaltyPoints` | Number | Default: 50 | Circulating wallet points (50 welcome bonus) |
| `tier` | String | `Silver` / `Gold` / `Platinum` | Calculated based on loyalty status |
| `createdAt` / `updatedAt` | Date | Timestamps | Automatic audit timestamps |

### 2. `purchases` Collection
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Unique purchase transaction ID |
| `billNumber` | String | Required, Unique | Auto-incremented invoice number (`MF-1001`, etc.) |
| `customer` | ObjectId | Required, Ref `Customer`, Indexed | Foreign key linking to customer |
| `items` | Array | Objects | Footwear category, description, quantity, unit price |
| `originalAmount` | Number | Required, min 0 | Gross bill amount before discounts (₹) |
| `discountAmount` | Number | Default: 0 | Discount deducted (₹) computed by backend |
| `loyaltyDiscountApplied` | Boolean | Default: false | True if 10% loyalty cycle reward was applied |
| `finalAmount` | Number | Required, min 0 | Net amount paid by customer (`originalAmount - discountAmount`) |
| `pointsEarned` | Number | Default: 0 | 5% reward rate (1 pt per ₹20 paid) |
| `submissionToken` | String | Sparse Index | Idempotency token preventing duplicate submissions |
| `paymentMethod` | String | `UPI / QR` / `Cash` / `Card` | Payment mode selected at checkout |
| `purchaseDate` | Date | Default: Date.now, Indexed | Transaction timestamp |

---

## 📡 Main API Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System status check |
| `GET` | `/api/stats` | MongoDB aggregation deriving total customers, purchases, sales, and discounts |
| `GET` | `/api/customers` | List all customers or search via `?search=` by name or phone |
| `GET` | `/api/customers/:id` | Get customer profile with total qualifying purchases and order history |
| `POST` | `/api/customers` | Register customer with phone normalization and duplicate prevention |
| `GET` | `/api/purchases` | Fetch all purchases (supports `?search=` by customer, phone, or invoice) |
| `GET` | `/api/purchases/discount-preview`| Backend calculation of 10% discount eligibility before confirming order |
| `POST` | `/api/purchases` | Record purchase, apply 10% reward on 6th order, start new cycle, prevent duplicates |

---

## 🧪 Verified Test Cases

### Test 1: Duplicate Phone Validation (HTTP 409)
```bash
curl -s -i -X POST http://localhost:5001/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Duplicate Check","phone":"9876543210"}'
# Result: HTTP 409 Conflict with "Customer with phone number already exists"
```

### Test 2: Client Discount Tampering Prevention
```bash
# Attempt to send client-chosen discountAmount and finalAmount:
curl -s -X POST http://localhost:5001/api/purchases \
  -H "Content-Type: application/json" \
  -d '{"customerId":"<CUSTOMER_ID>","amount":2000,"discountAmount":1999,"finalAmount":1}'
# Result: Backend ignores client numbers, calculates discount=0, finalAmount=2000
```

### Test 3: 5th Purchase $\to$ 6th Purchase with 10% Discount $\to$ New Cycle
1. **5th Purchase** (Vikram Malhotra at 4/5):
   * Record purchase of ₹3,000 $\to$ Discount = ₹0, Paid = ₹3,000.
   * Customer state updates to `totalQualifyingPurchases: 5`, `qualifyingPurchasesInCycle: 5`, `rewardAvailable: true`.
2. **6th Purchase** (Discount Earned):
   * Record purchase of ₹4,000 $\to$ Backend applies 10% discount: **-₹400**, Paid = **₹3,600**.
   * Customer reward is redeemed: `rewardAvailable: false`, `qualifyingPurchasesInCycle: 0` (**New cycle started!**).
3. **Next Reward Cycle** (7th Purchase):
   * Record purchase of ₹2,500 $\to$ Discount = ₹0, Paid = ₹2,500.
   * Cycle advances to `1 of 5` towards next reward.

### Test 4: Duplicate Submission Prevention
```bash
# Sending identical submissionToken twice returns the already recorded invoice without charging twice:
curl -s -X POST http://localhost:5001/api/purchases \
  -H "Content-Type: application/json" \
  -d '{"customerId":"<ID>","amount":2500,"submissionToken":"tok_duplicate_check"}'
# Result: duplicatePrevented: true, returns existing bill MF-XXXX
```

---

## 🎓 DBMS Viva Guide

### 1. What is MongoDB and NoSQL?
* **NoSQL** stands for *"Not Only SQL"*. Unlike traditional Relational DBMS (RDBMS) which strictly enforce tabular rows and foreign keys, NoSQL databases provide flexible schema designs, horizontal scaling, and high read/write performance.
* **MongoDB** is an open-source, document-oriented NoSQL database that stores data in flexible **BSON** (Binary JSON) documents.

### 2. Documents vs. Collections
* **Document**: The basic unit of data in MongoDB (equivalent to a row in SQL). Represented in JSON-like key-value pairs (e.g. `{ name: "Rahul", phone: "9876543210" }`).
* **Collection**: A grouping of MongoDB documents (equivalent to a table in SQL). Collections do not enforce rigid table alters when fields change.

### 3. What are Indexes and why are they used?
* Indexes are special data structures (B-Tree) that store a small portion of the collection's data in an easy-to-traverse form.
* **In this project**:
  * `phone` index on `customers`: Guarantees $O(1)$ unique lookup and prevents duplicate registrations.
  * `customer` index on `purchases`: Speeds up joins (`populate()`) when viewing customer history.
  * `purchaseDate` index: Speeds up chronological sorting and dashboard date range queries.

### 4. CRUD Operations in this Project
* **Create**: `Customer.create({...})` registers a customer; `new Purchase({...}).save()` inserts an invoice.
* **Read**: `Customer.find({ $or: [...] })` searches customers; `Customer.findById(id)` fetches single customer details.
* **Update**: `customer.totalSpent += finalAmount`, `customer.qualifyingPurchasesInCycle = 0` updates state in MongoDB.
* **Delete**: `Customer.deleteMany({})` used during clean database re-seeding.

### 5. Aggregation Pipeline vs Simple Queries
* The **Aggregation Framework** is MongoDB's multi-stage data processing pipeline (equivalent to `GROUP BY`, `SUM`, `COUNT` in SQL).
* In `backend/routes/statsRoutes.js`, we use:
  ```javascript
  Purchase.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$finalAmount" },
        discountsGranted: { $sum: "$discountAmount" }
      }
    }
  ])
  ```
  This computes store sales and discount totals entirely in the database engine rather than loading thousands of records into Node.js memory.

### 6. Why does MongoDB suit this Footwear Loyalty Project?
1. **Hierarchical Cart Structure**: Each purchase contains an array of footwear items (`items: [{ category, description, quantity, price }]`). In SQL this requires a separate `purchase_items` junction table; in MongoDB it embeds naturally inside the purchase document.
2. **Atomic Customer Updates**: Mongoose methods allow atomic increments to customer counters (`totalQualifyingPurchases`, `totalSpent`) during purchase saves.
3. **Rapid Prototyping & Scalability**: Flexible document models adapt easily as loyalty rules or retail item attributes evolve.
