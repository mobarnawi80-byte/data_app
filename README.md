# 🇳🇬 Nigerian Data & Airtime VTU Platform - Backend Service Layer & Database Schema

A production-grade Node.js (Express) database schema and service layer using Prisma ORM targeting PostgreSQL/MySQL for a Nigerian Virtual Top-Up (VTU) Airtime and Data platform.

---

## 🛠️ Architecture & Financial Integrity Safeguards

1. **Prisma ORM & PostgreSQL Schema**:
   - `Users`: Full user lifecycle with encrypted passwords (bcrypt) and 4-digit transaction PIN hashing, biometric toggle, and account status control (`ACTIVE` / `SUSPENDED`).
   - `Wallets`: 1-to-1 strict relation with Users. Stores balances using fixed `Decimal(12,2)` precision to eliminate floating-point representation bugs. Includes virtual bank account placeholders (Monnify / Wema Bank).
   - `LedgerEntries`: Double-entry accounting system recording every balance modification (`CREDIT` / `DEBIT`) with `balance_before`, `balance_after`, unique reference string, and description.
   - `Transactions`: Complete audit trail of VTU purchases (Airtime & Data) with network operator (`MTN`, `AIRTEL`, `GLO`, `NINE_MOBILE`), provider attribution (`INLOMAX`, `HUSMODATA`), provider references, status lifecycle (`PENDING`, `SUCCESS`, `FAILED`), and retry metrics.

2. **Atomic Financial Transactions**:
   - All balance updates run inside PostgreSQL interactive transactions (`prisma.$transaction`).
   - Concurrency control with `gte` balance constraints prevents negative balances and double spending.

3. **Resilient VTU Provider Integration & Auto-Refund**:
   - Polling/dispatching to third-party VTU gateways (`InlomaxProvider` and `HusmodataProvider`) implemented under a unified `IVTUProvider` interface.
   - Intelligent fallback switching: if the primary provider encounters a network outage, request automatically retries via the secondary provider.
   - **Automatic Refund Guarantee**: If all VTU provider retries fail, the system automatically updates transaction status to `FAILED` and credits the user's wallet with an auto-refund `LedgerEntry` inside a database transaction.

---

## 📂 Project Structure

```
data_app/
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma
└── src/
    ├── config/
    │   └── prisma.ts
    ├── types/
    │   └── vtu.ts
    ├── services/
    │   ├── userService.ts
    │   ├── walletService.ts
    │   ├── vtuService.ts
    │   └── providers/
    │       ├── vtuProvider.interface.ts
    │       ├── inlomaxProvider.ts
    │       └── husmodataProvider.ts
    ├── controllers/
    │   ├── userController.ts
    │   ├── walletController.ts
    │   └── vtuController.ts
    ├── routes/
    │   ├── userRoutes.ts
    │   ├── walletRoutes.ts
    │   └── vtuRoutes.ts
    ├── app.ts
    └── server.ts
```

---

## 🔌 API Endpoints Summary

### 👤 User Endpoints (`/api/users`)
- `POST /api/users/register` - Register a new user & auto-provision wallet.
- `GET /api/users/:id` - Fetch user profile and attached wallet.
- `PATCH /api/users/:id/status` - Suspend or activate user account.

### 💳 Wallet Endpoints (`/api/wallets`)
- `GET /api/wallets/:userId` - Fetch user wallet balance and virtual account details.
- `POST /api/wallets/credit` - Credit wallet balance with an immutable ledger entry.
- `GET /api/wallets/:userId/ledger` - Fetch paginated audit ledger history.

### 📱 VTU Endpoints (`/api/vtu`)
- `POST /api/vtu/purchase` - Execute Airtime or Data VTU purchase (requires transaction PIN).
- `GET /api/vtu/history/:userId` - Fetch user's VTU transaction history.
- `GET /api/vtu/transaction/:reference` - Fetch detailed VTU transaction by unique reference.

---

## 🚀 Setup & Execution Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Database**:
   Update `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/vtu_db?schema=public"
   ```

3. **Run Prisma Migrations**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
