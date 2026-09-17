# Touchscreen Self-Order Restaurant POS & Kiosk System
### Muscat, Sultanate of Oman (مسقط، سلطنة عُمان)

A complete, production-ready, offline-first **Touchscreen Self-Order Restaurant POS and Kiosk System** designed specifically for restaurants in **Muscat, Oman**.

---

## 🛑 CORE PAYMENT RULE

> **THE KIOSK DOES NOT ACCEPT PAYMENT.**
>
> There is **NO online payment gateway, NO credit card reader, NO Apple Pay, NO Google Pay, and NO payment processing inside the kiosk application.**
>
> **The Exact Customer Workflow:**
> 1. Customer browses the menu on the touchscreen kiosk (`/kiosk`).
> 2. Customer selects & customizes items (adds extras, modifies sauces, chooses spice levels).
> 3. Customer selects **Dine In** (+ enters Table Number on touch keypad) or **Takeaway**.
> 4. Customer reviews order summary and clicks **CONFIRM ORDER**.
> 5. System atomically assigns a sequential order number (e.g., `#1042`) and status **🔴 PENDING PAYMENT**.
> 6. Thermal receipt printer prints receipt clearly stating:
>    ```
>    *** PAYMENT STATUS: PENDING PAYMENT ***
>    *** PLEASE PAY AT THE COUNTER ***
>    ```
> 7. Customer takes the printed receipt to the counter.
> 8. Cashier collects payment manually (**CASH** or **CARD POS machine**).
> 9. Cashier clicks **[ MARK AS PAID ]** on the Staff POS screen (`/staff`).
> 10. Status updates to **🟢 PAID**, and the order is instantly dispatched via WebSockets to the Kitchen Display System (`/kitchen`) for cooking!

---

## 🏛️ System Architecture

```
                                  [ Restaurant Local Network (LAN) ]
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │ Kiosk 1 (Touch) │      │ Kiosk 2 (Touch) │      │ Staff POS Screen│      │ Kitchen KDS     │
  │   URL: /kiosk   │      │   URL: /kiosk   │      │   URL: /staff   │      │   URL: /kitchen │
  └────────┬────────┘      └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
           │                        │                        │                        │
           └────────────────────────┴───────────┬────────────┴────────────────────────┘
                                                │ HTTP REST + Socket.IO (Port 5000)
                                                ▼
                             ┌─────────────────────────────────────┐
                             │  Local Node.js + Express Backend    │
                             │  • Server-Side Pricing Engine       │
                             │  • Atomic Sequential Numbering      │
                             │  • ESC/POS Thermal Print Dispatch   │
                             └──────────────────┬──────────────────┘
                                                │ Prisma ORM (Sole DB Client)
                                                ▼
                             ┌─────────────────────────────────────┐
                             │    Local SQLite Database (dev.db)   │
                             │    (100% Offline-First)             │
                             └─────────────────────────────────────┘
```

---

## 🌟 Key Features

1. **Touchscreen-First Customer Kiosk (`/kiosk`)**:
   - High-contrast, large touch targets (minimum 48px), responsive active feedback.
   - Bilingual: English (LTR) and Arabic (RTL) with Arabic typography (`Cairo` font) and instant toggle.
   - Large touch keypad for entering Table Number (1–99).
   - Product customization modal (Single-choice sizes, multi-choice extras, removals, spice levels).
   - Inactivity detector: prompts *"Are you still ordering?"* with 15-second countdown and resets cart to protect privacy.
   - Built-in Virtual Thermal Printer Roll Simulator that animates the printed receipt.

2. **Counter / Staff POS (`/staff`)**:
   - Real-time incoming order stream with audio chime alerts.
   - High-visibility **🔴 PENDING PAYMENT** queue so cashiers immediately identify waiting customers.
   - Cashier settlement modal:
     - **Cash**: Enter received amount; calculates change in OMR. Rejects insufficient cash.
     - **Card**: Fast card settlement (uses countertop physical bank POS machine).
   - Instant receipt reprinting with `*** DUPLICATE / REPRINT ***` audit banner.
   - Order cancellation requiring mandatory reason with audit log.

3. **Kitchen Display System (`/kitchen`)**:
   - High-contrast dark mode display for kitchen tablets and monitors.
   - **Strict Payment Guard**: Only shows tickets after the cashier marks them **PAID** (unpaid orders are withheld from kitchen queue).
   - Live elapsed timer per ticket with color urgency:
     - `< 5 min`: Emerald Green
     - `5–10 min`: Amber Warning
     - `> 10 min`: Flashing Red Alert
   - One-touch progression: `[ START PREPARING ]` ➔ `[ MARK READY ]` ➔ `[ COMPLETE ]`.

4. **Admin Dashboard (`/admin`)**:
   - KPI metrics: Today's Sales (OMR), Total Orders, Pending Payments, Paid Orders, Cancelled Orders, Average Order Value (AOV).
   - Hourly sales distribution bar chart.
   - Menu Management: Full CRUD for categories, products, images, and modifier groups.
   - Configurable Oman VAT: Toggle tax on/off, set VAT percentage (e.g. 5%), tax inclusive/exclusive toggle.
   - Thermal Printer Settings: 58mm / 80mm selection, auto-print toggle, raw TCP socket IP & port, and one-click Test Print.
   - Comprehensive audit logs tracking every payment, cancellation, and receipt reprint.

5. **Security & Exact OMR Money Handling**:
   - **Server-Side Pricing**: The kiosk frontend only transmits product IDs and quantities. Prices, subtotals, VAT, and totals are computed strictly server-side from current database values.
   - **Atomic Order Numbering**: Sequential order numbering starting at `#1001` incremented inside a Prisma database transaction with `@unique` constraint. Concurrent kiosk orders can never duplicate numbers.
   - **Exact Minor Units**: All monetary values are calculated in integer thousandths (**Baisa**), eliminating JavaScript floating-point errors (e.g. `OMR 1.500 = 1500 Baisa`). All displays format to exactly 3 decimals.
   - **Historical Snapshots**: `OrderItem` stores immutable snapshots of product names, unit prices, and modifier prices. Historical receipts never change even if an admin updates menu prices later.

---

## 🚀 Installation & Quick Start

### Prerequisites
- Node.js v18+ (tested on v22.x)
- npm v10+
- Windows 10/11 or Linux

### 1. Clone & Install Backend
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

### 2. Install Frontend
```bash
cd ../client
npm install
npm run build
```

### 3. Run in Development Mode
Open two terminal windows:

**Terminal 1 (Backend Server on Port 5000):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client on Port 3000):**
```bash
cd client
npm run dev
```

Visit the applications in your browser:
- **Customer Kiosk**: [http://localhost:3000/kiosk](http://localhost:3000/kiosk)
- **Staff Counter POS**: [http://localhost:3000/staff](http://localhost:3000/staff)
- **Kitchen Display**: [http://localhost:3000/kitchen](http://localhost:3000/kitchen)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Staff Login**: [http://localhost:3000/login](http://localhost:3000/login)

---

## 🔑 Demo Credentials

| Role | Username | Password | Quick Touchscreen PIN | Default Route |
| :--- | :--- | :--- | :--- | :--- |
| **Cashier** | `cashier1` | `cashier123` | **`1111`** | `/staff` |
| **Kitchen Staff** | `kitchen1` | `kitchen123` | **`2222`** | `/kitchen` |
| **Admin Manager** | `admin` | `admin123` | **`1234`** | `/admin` |
| **Manager** | `manager` | `manager123` | **`5555`** | `/staff` or `/admin` |

---

## 🖨️ Thermal Receipt Printing Architecture

The system supports a 4-tier printing architecture:

```
                  ┌─────────────────────────────────────────┐
                  │          Print Job Generated            │
                  └────────────────────┬────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
         [ 1. Network ESC/POS ]                [ 3. Browser Print ]
       Direct TCP Socket to Port 9100        Window.print() with exact
       (e.g., 192.168.1.200:9100)            58mm/80mm @media print CSS
                    │                                     │
                    ▼                                     ▼
         [ 2. Disconnected Fallback ]          [ 4. Virtual Simulator ]
       Safe error capture; order is never    Interactive on-screen animated
       lost; staff can reprint from POS      thermal paper roll preview
```

### Thermal Receipt Format Sample:
```
================================================
          Muscat Grill & Burger Lounge
        مطعم ولاونج مسقط للمشاوي والبرجر
    Al Khuwair St, Muscat, Sultanate of Oman
              Tel: +968 24 556677
================================================
                  ORDER #1042
               Terminal: Kiosk-1
Date: 16/09/2026, 12:35:10
Type: DINE IN | Table: 12
------------------------------------------------
2x Muscat Truffle Angus Burger          5.600 OMR
   + Extra Melted Cheddar                +0.500
1x Loaded Oman Chips Fries              1.400 OMR
2x Karak Chai with Saffron              0.700 OMR
------------------------------------------------
Subtotal:                               7.700 OMR
Oman VAT (5% incl):                     0.367 OMR
================================================
TOTAL DUE:                              7.700 OMR
================================================
************************************************
PAYMENT STATUS: PENDING PAYMENT
PLEASE TAKE THIS RECEIPT TO THE COUNTER TO PAY
************************************************

      Thank you for your visit! Please pay at the counter.
      شكراً لزيارتكم الكريمة! يرجى الدفع عند الكاونتر.
```

---

## 🌐 Multi-Kiosk Setup on Local LAN

To connect multiple kiosks (e.g. Kiosk 1, Kiosk 2, Kiosk 3) to the central restaurant server:

1. Identify the Server's Local IP address (e.g. `192.168.1.100`).
2. Start the backend server on the main machine:
   ```bash
   cd server
   npm start
   ```
3. Open each kiosk touchscreen browser pointing to the server's IP with the `kioskId` query parameter:
   - **Kiosk 1:** `http://192.168.1.100:5000/kiosk?kioskId=Kiosk-1`
   - **Kiosk 2:** `http://192.168.1.100:5000/kiosk?kioskId=Kiosk-2`
   - **Kiosk 3:** `http://192.168.1.100:5000/kiosk?kioskId=Kiosk-3`
4. The system automatically tags every order with the creating kiosk ID (`order.kioskId`).

---

## 🔒 Offline-First Capability

- The system runs entirely within the local restaurant premises.
- All database records are stored in the local SQLite database (`server/prisma/dev.db`).
- Does **NOT** require an active internet connection for menu browsing, order creation, receipt printing, cashier settlement, or kitchen ticketing.

---

## 🧪 Verification & Automated Tests

To run the automated end-to-end verification suite:
```bash
cd server
npx ts-node src/test_e2e.ts
```

The test suite automatically validates:
- Simultaneous order creation across multiple kiosks with zero duplicate order numbers.
- Server-side pricing enforcement.
- Exact 3-decimal OMR calculations in Baisa.
- Cashier cash settlement with change calculation & underpayment rejection.
- Strict kitchen ticket filtering (only paid orders enter preparation).
- Order cancellation with mandatory reason logging.
- Product price snapshot protection.
