# Google Pay-like Payments Application - Complete Plan

## Overview
A comprehensive mobile payments application for India with UPI integration, similar to Google Pay, built entirely with open-source technologies.

## Technology Stack

### Mobile Application
- **Framework**: React Native (with Expo for faster development)
- **State Management**: Redux Toolkit or Zustand
- **Navigation**: React Navigation
- **UI Components**: React Native Paper or NativeBase
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Storage**: AsyncStorage / SecureStore (for sensitive data)
- **QR Code**: react-native-qrcode-scanner, react-native-qrcode-svg
- **Biometric Auth**: react-native-biometrics
- **Push Notifications**: React Native Firebase (FCM)
- **Maps/Location**: React Native Maps
- **Image Picker**: react-native-image-picker

### Backend API
- **Framework**: Node.js + Express.js (or FastAPI with Python)
- **Language**: TypeScript (recommended)
- **Database**: PostgreSQL (primary), Redis (caching/sessions)
- **ORM**: Prisma (or TypeORM)
- **Authentication**: JWT tokens + Refresh tokens
- **API Documentation**: Swagger/OpenAPI
- **Queue System**: Bull (Redis-based) for async tasks
- **WebSockets**: Socket.io for real-time notifications
- **File Storage**: AWS S3 / MinIO (for documents)
- **Logging**: Winston
- **Validation**: Zod
- **Encryption**: crypto-js, bcrypt

### Payment Gateway Integration
- **UPI Integration**: Razorpay UPI SDK / Paytm Business API / PhonePe APIs
- **Alternative**: Direct NPCI UPI integration (requires PSP license)
- **Bank Account Verification**: Razorpay Account Verification API
- **Payment Links**: Razorpay Payment Links API

### Infrastructure & DevOps
- **Backend Hosting**: AWS EC2 / DigitalOcean / Railway / Render
- **Database Hosting**: AWS RDS PostgreSQL / Supabase / Railway PostgreSQL
- **Redis**: AWS ElastiCache / Upstash Redis
- **CDN**: CloudFront / Cloudflare
- **Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry (open-source alternative: GlitchTip)
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose

### Security & Compliance
- **Encryption**: AES-256 for sensitive data at rest
- **TLS**: HTTPS only (Let's Encrypt certificates)
- **PIN Storage**: Bcrypt hashed (never plain text)
- **KYC**: Aadhaar verification (via Razorpay KYC API or direct UIDAI)
- **Compliance**: RBI guidelines, PCI-DSS considerations
- **2FA**: TOTP (Google Authenticator compatible)

## Database Schema

### Core Tables

#### Users
```prisma
model User {
  id              String   @id @default(cuid())
  phoneNumber     String   @unique
  email           String?  @unique
  name            String
  profileImage    String?
  isKycVerified   Boolean  @default(false)
  kycStatus       String   @default("PENDING") // PENDING, VERIFIED, REJECTED
  pinHash         String   // Bcrypt hashed 6-digit PIN
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  bankAccounts    BankAccount[]
  transactions    Transaction[]
  wallet          Wallet?
  contacts        Contact[]
  savedBills      SavedBill[]
  upiId           UpiId?
}
```

#### Wallet
```prisma
model Wallet {
  id            String   @id @default(cuid())
  userId        String   @unique
  balance       Decimal  @default(0) // In rupees
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id])
  transactions  Transaction[]
}

model BankAccount {
  id            String   @id @default(cuid())
  userId        String
  accountNumber String   // Encrypted
  ifscCode      String
  bankName      String
  accountHolderName String
  isVerified    Boolean  @default(false)
  isPrimary     Boolean  @default(false)
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
  transactions  Transaction[]
  
  @@index([userId])
}
```

#### UPI ID
```prisma
model UpiId {
  id            String   @id @default(cuid())
  userId        String   @unique
  upiId         String   @unique // e.g., username@payapp
  isActive      Boolean  @default(true)
  isVerified    Boolean  @default(false)
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
}
```

#### Transactions
```prisma
enum TransactionType {
  P2P           // Person to Person
  MERCHANT      // Merchant payment
  BILL_PAYMENT  // Utility bill
  RECHARGE      // Mobile/DTH recharge
  BANK_TRANSFER // Bank to wallet
  WALLET_TO_BANK // Wallet to bank
  REFUND
}

enum TransactionStatus {
  PENDING
  PROCESSING
  SUCCESS
  FAILED
  CANCELLED
}

model Transaction {
  id              String            @id @default(cuid())
  transactionId   String            @unique // UPI Transaction ID
  userId          String
  type            TransactionType
  status          TransactionStatus
  amount          Decimal
  currency        String            @default("INR")
  
  // Sender details
  fromUserId      String?
  fromBankAccountId String?
  
  // Receiver details
  toUserId        String?
  toBankAccountId String?
  toUpiId         String?
  toPhoneNumber   String?
  merchantId      String?
  
  // Additional info
  description     String?
  referenceId     String?           // Bill reference, merchant order ID, etc.
  upiReferenceId  String?           // UPI transaction reference
  failureReason   String?
  
  // QR Code details (if applicable)
  qrCodeId        String?
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  completedAt     DateTime?
  
  user            User              @relation(fields: [userId], references: [id])
  wallet          Wallet?
  fromBankAccount BankAccount?      @relation("FromTransactions", fields: [fromBankAccountId], references: [id])
  toBankAccount   BankAccount?      @relation("ToTransactions", fields: [toBankAccountId], references: [id])
  qrCode          QrCode?           @relation(fields: [qrCodeId], references: [id])
  
  @@index([userId, createdAt])
  @@index([transactionId])
  @@index([status])
  @@index([type])
}
```

#### QR Codes
```prisma
model QrCode {
  id              String   @id @default(cuid())
  userId          String
  type            String   // "PAY", "COLLECT"
  amount          Decimal?
  description     String?
  qrImageUrl      String
  upiString       String   // Full UPI payment string
  isActive        Boolean  @default(true)
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  
  user            User?
  transactions    Transaction[]
  
  @@index([userId])
}
```

#### Contacts
```prisma
model Contact {
  id            String   @id @default(cuid())
  userId        String
  phoneNumber   String
  name          String?
  upiId         String?
  isFavourite   Boolean  @default(false)
  lastTransactionAt DateTime?
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, phoneNumber])
  @@index([userId])
}
```

#### Bill Payments
```prisma
model BillCategory {
  id            String   @id @default(cuid())
  name          String   @unique // "Electricity", "Mobile", "Gas", etc.
  icon          String?
  isActive      Boolean  @default(true)
  
  bills         SavedBill[]
}

model SavedBill {
  id              String   @id @default(cuid())
  userId          String
  categoryId      String
  provider        String   // BSNL, Airtel, BESCOM, etc.
  customerId      String   // Encrypted
  customerName    String?
  amount          Decimal?
  dueDate         DateTime?
  billNumber      String?
  isAutoPay       Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  category        BillCategory @relation(fields: [categoryId], references: [id])
  
  @@index([userId])
}
```

#### Merchants
```prisma
model Merchant {
  id            String   @id @default(cuid())
  name          String
  upiId         String   @unique
  logoUrl       String?
  category      String?
  isVerified    Boolean  @default(false)
  createdAt     DateTime @default(now())
  
  transactions  Transaction[]
}
```

## Core Features Implementation

### 1. User Registration & Authentication

#### Registration Flow
1. User enters phone number
2. OTP sent via SMS (Twilio / AWS SNS)
3. OTP verification
4. User sets 6-digit PIN (stored as bcrypt hash)
5. Basic profile setup (name, optional email)
6. KYC initiation prompt

#### Authentication Flow
1. Phone number + PIN login
2. Biometric authentication (Face ID / Fingerprint)
3. JWT token generation
4. Refresh token rotation

**API Endpoints:**
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `POST /api/auth/login` - Login with PIN
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/biometric-setup` - Enable biometric auth

### 2. Wallet & Balance Management

**API Endpoints:**
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/add-money` - Add money from bank
- `POST /api/wallet/withdraw` - Transfer to bank

**Implementation:**
- Real-time balance updates via WebSocket
- Transaction history with pagination
- Balance caching in Redis for performance

### 3. Bank Account Linking

**Flow:**
1. User enters account details (account number, IFSC)
2. Account verification via Razorpay API
3. Micro-deposit verification (optional)
4. Account linked and available

**API Endpoints:**
- `POST /api/bank-accounts/add` - Add bank account
- `POST /api/bank-accounts/verify` - Verify account
- `GET /api/bank-accounts` - List linked accounts
- `DELETE /api/bank-accounts/:id` - Remove account
- `PUT /api/bank-accounts/:id/primary` - Set primary account

### 4. UPI ID Creation

**Flow:**
1. User chooses unique username
2. System checks availability
3. Create UPI ID: `username@payapp`
4. Link to user account

**API Endpoints:**
- `POST /api/upi/check-availability` - Check username availability
- `POST /api/upi/create` - Create UPI ID
- `GET /api/upi/my-id` - Get user's UPI ID

### 5. Send Money (P2P)

**Flow:**
1. User selects recipient (contact/phone/UPI ID)
2. Enter amount and description
3. Enter PIN to authorize
4. Create UPI payment request
5. Process via payment gateway
6. Update wallet balances
7. Send notifications

**API Endpoints:**
- `POST /api/transactions/send-money` - Send money
- `POST /api/transactions/request-money` - Request money
- `GET /api/transactions/:id` - Get transaction details

### 6. QR Code Payments

**Generate QR Code:**
1. User selects "Request Money"
2. Enter amount (optional)
3. Generate UPI QR code string
4. Display QR code image
5. Share QR code

**Scan & Pay:**
1. User scans QR code
2. Extract payment details
3. Confirm amount and recipient
4. Authorize with PIN
5. Process payment

**API Endpoints:**
- `POST /api/qr/generate` - Generate QR code
- `POST /api/qr/scan` - Process scanned QR code
- `GET /api/qr/:id` - Get QR code details

### 7. Bill Payments

**Flow:**
1. User selects bill category
2. Enter provider and customer ID
3. Fetch bill details
4. Confirm and pay
5. Store as saved bill (optional)

**Supported Categories:**
- Mobile Recharge (Prepaid/Postpaid)
- DTH Recharge
- Electricity
- Gas (LPG)
- Water
- Broadband
- Insurance

**API Endpoints:**
- `GET /api/bills/categories` - List bill categories
- `POST /api/bills/fetch` - Fetch bill details
- `POST /api/bills/pay` - Pay bill
- `GET /api/bills/saved` - Get saved bills
- `POST /api/bills/save` - Save bill for future

### 8. Contacts Management

**Flow:**
1. Sync contacts from phone
2. Match phone numbers with app users
3. Display contacts with UPI IDs
4. Recent transactions with contacts
5. Favorites management

**API Endpoints:**
- `POST /api/contacts/sync` - Sync phone contacts
- `GET /api/contacts` - Get app contacts
- `POST /api/contacts/favourite` - Mark as favourite
- `GET /api/contacts/:phoneNumber` - Get contact details

### 9. Transaction History

**Features:**
- Filter by type, date range, status
- Search transactions
- Export statements (PDF)
- Transaction categories

**API Endpoints:**
- `GET /api/transactions` - List transactions (with filters)
- `GET /api/transactions/statement` - Generate statement PDF
- `GET /api/transactions/summary` - Get monthly summary

### 10. Push Notifications

**Use Cases:**
- Transaction success/failure
- Money received
- Bill payment reminders
- Security alerts

**Implementation:**
- Firebase Cloud Messaging (FCM)
- Real-time WebSocket notifications
- In-app notification center

### 11. Security Features

**PIN Management:**
- 6-digit PIN (bcrypt hashed)
- PIN change (requires current PIN)
- PIN reset (via OTP)

**Biometric Authentication:**
- Face ID / Fingerprint login
- Transaction authorization (optional)

**Security Settings:**
- Enable/disable biometrics
- Change PIN
- View login history
- Device management

**API Endpoints:**
- `POST /api/security/change-pin` - Change PIN
- `POST /api/security/reset-pin` - Reset PIN
- `POST /api/security/biometric` - Toggle biometric
- `GET /api/security/login-history` - Get login history

### 12. KYC Verification

**Flow:**
1. Upload Aadhaar card
2. Enter Aadhaar number
3. OTP verification via UIDAI
4. PAN card upload (optional)
5. Selfie verification
6. Status tracking

**API Endpoints:**
- `POST /api/kyc/initiate` - Start KYC
- `POST /api/kyc/upload-document` - Upload document
- `POST /api/kyc/verify-aadhaar` - Verify Aadhaar
- `GET /api/kyc/status` - Get KYC status

## Mobile App Architecture

### Project Structure
```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── OtpScreen.tsx
│   │   │   ├── PinSetupScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Home/
│   │   │   ├── HomeScreen.tsx
│   │   │   └── DashboardScreen.tsx
│   │   ├── Wallet/
│   │   │   ├── BalanceScreen.tsx
│   │   │   └── AddMoneyScreen.tsx
│   │   ├── Transactions/
│   │   │   ├── TransactionHistoryScreen.tsx
│   │   │   └── TransactionDetailScreen.tsx
│   │   ├── SendMoney/
│   │   │   ├── SelectContactScreen.tsx
│   │   │   ├── EnterAmountScreen.tsx
│   │   │   └── ConfirmScreen.tsx
│   │   ├── QRCode/
│   │   │   ├── ScanQRScreen.tsx
│   │   │   └── GenerateQRScreen.tsx
│   │   ├── Bills/
│   │   │   ├── BillCategoriesScreen.tsx
│   │   │   └── PayBillScreen.tsx
│   │   └── Profile/
│   │       ├── ProfileScreen.tsx
│   │       ├── BankAccountsScreen.tsx
│   │       └── SecurityScreen.tsx
│   ├── components/
│   │   ├── TransactionCard.tsx
│   │   ├── QRCodeScanner.tsx
│   │   ├── AmountInput.tsx
│   │   └── PinInput.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── AuthNavigator.tsx
│   ├── store/
│   │   ├── authSlice.ts
│   │   ├── walletSlice.ts
│   │   └── transactionSlice.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── transactionService.ts
│   │   └── notificationService.ts
│   ├── utils/
│   │   ├── storage.ts
│   │   ├── encryption.ts
│   │   └── formatters.ts
│   └── types/
│       └── index.ts
├── app.json
└── package.json
```

### Key Screens

1. **Splash Screen** - App initialization, check auth status
2. **Login Screen** - Phone number + PIN or biometric
3. **Home Screen** - Balance, quick actions, recent transactions
4. **Send Money Screen** - Contact selection, amount entry
5. **QR Scanner Screen** - Camera-based QR code scanning
6. **Transaction History** - List with filters
7. **Profile Screen** - Settings, bank accounts, security

## Backend API Architecture

### Project Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── walletController.ts
│   │   ├── transactionController.ts
│   │   └── userController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── paymentService.ts
│   │   ├── upiService.ts
│   │   ├── billService.ts
│   │   └── notificationService.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── wallet.ts
│   │   └── transactions.ts
│   ├── utils/
│   │   ├── encryption.ts
│   │   ├── qrCode.ts
│   │   └── otp.ts
│   ├── queue/
│   │   └── transactionQueue.ts
│   ├── websocket/
│   │   └── socketServer.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

### API Routes Structure

```
/api
├── /auth
│   ├── POST /send-otp
│   ├── POST /verify-otp
│   ├── POST /login
│   └── POST /refresh
├── /wallet
│   ├── GET /balance
│   ├── GET /transactions
│   ├── POST /add-money
│   └── POST /withdraw
├── /transactions
│   ├── POST /send-money
│   ├── POST /request-money
│   ├── GET /:id
│   └── GET / (list)
├── /qr
│   ├── POST /generate
│   ├── POST /scan
│   └── GET /:id
├── /contacts
│   ├── POST /sync
│   ├── GET /
│   └── POST /favourite
├── /bills
│   ├── GET /categories
│   ├── POST /fetch
│   └── POST /pay
├── /bank-accounts
│   ├── POST /add
│   ├── GET /
│   └── DELETE /:id
└── /security
    ├── POST /change-pin
    └── GET /login-history
```

## Payment Gateway Integration

### Option 1: Razorpay (Recommended for MVP)
- **UPI**: Razorpay UPI SDK
- **Account Verification**: Razorpay API
- **Payment Links**: Razorpay Payment Links
- **KYC**: Razorpay KYC API

**Setup:**
1. Create Razorpay account
2. Get API keys (Key ID, Key Secret)
3. Integrate Razorpay SDK in backend
4. Handle webhooks for payment status

### Option 2: Paytm Business API
- UPI integration
- Payment gateway
- Wallet services

### Option 3: Direct NPCI Integration
- Requires PSP (Payment Service Provider) license
- Direct UPI API access
- More control but complex setup

## Security Implementation

### Data Encryption
- **At Rest**: AES-256 encryption for sensitive fields (account numbers, PINs)
- **In Transit**: TLS 1.3 for all API calls
- **PIN Storage**: Bcrypt hash (cost factor 12)

### Authentication Security
- JWT tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- Token rotation on refresh
- Device fingerprinting
- Rate limiting on login attempts

### Transaction Security
- PIN required for all transactions
- Biometric verification (optional)
- Transaction limits (daily/monthly)
- Suspicious activity detection
- 2FA for large transactions

## Compliance & Regulations (India)

### RBI Guidelines
- Prepaid Payment Instrument (PPI) license considerations
- KYC requirements (Aadhaar/PAN)
- Transaction limits compliance
- Data localization (store in India)

### Data Privacy
- Personal Data Protection Bill compliance
- User consent management
- Data retention policies
- Right to deletion

## Deployment Strategy

### Phase 1: MVP (Minimum Viable Product)
1. User registration & authentication
2. Wallet balance
3. Send money via UPI
4. QR code payments
5. Transaction history

### Phase 2: Enhanced Features
1. Bank account linking
2. Bill payments
3. Contacts management
4. Push notifications

### Phase 3: Advanced Features
1. KYC verification
2. Merchant payments
3. Recurring payments
4. Analytics dashboard

## Development Timeline Estimate

- **Phase 1 (MVP)**: 8-12 weeks
  - Backend API: 4 weeks
  - Mobile App: 4-6 weeks
  - Testing & Integration: 2 weeks

- **Phase 2**: 6-8 weeks
- **Phase 3**: 4-6 weeks

**Total: 18-26 weeks for complete application**

## Cost Estimates (Monthly)

### Development Tools
- GitHub: Free (public repos)
- CI/CD: Free (GitHub Actions)

### Infrastructure (Production)
- Backend Hosting: $50-200/month (AWS/DigitalOcean)
- Database: $50-150/month (PostgreSQL)
- Redis: $20-50/month
- File Storage: $10-30/month (S3)
- CDN: $10-50/month
- Monitoring: $20-50/month

**Total Infrastructure: ~$160-530/month**

### Third-Party Services
- SMS Gateway (OTP): $0.01-0.02 per SMS
- Push Notifications: Free (FCM)
- Payment Gateway: 2-3% transaction fee
- KYC Service: $1-5 per verification

## Open Source Alternatives

### If Avoiding Paid Services
- **SMS**: Self-hosted SMS gateway or Twilio alternative
- **Payment Gateway**: Direct NPCI integration (requires license)
- **Hosting**: Self-hosted on VPS
- **Monitoring**: Prometheus + Grafana (self-hosted)

## Next Steps

1. **Set up development environment**
   - Install Node.js, React Native CLI, Expo
   - Set up PostgreSQL database
   - Initialize project repositories

2. **Design database schema**
   - Create Prisma schema
   - Run initial migrations
   - Set up seed data

3. **Build authentication system**
   - OTP service integration
   - PIN management
   - JWT implementation

4. **Integrate payment gateway**
   - Razorpay account setup
   - UPI SDK integration
   - Test transactions

5. **Develop mobile app**
   - Set up React Native project
   - Implement core screens
   - Integrate with backend API

6. **Testing & Security**
   - Unit tests
   - Integration tests
   - Security audit
   - Penetration testing

7. **Deployment**
   - Backend deployment
   - Mobile app build (Android/iOS)
   - Production environment setup

---

**Note**: This is a comprehensive plan. For actual implementation, start with MVP features and iterate based on user feedback. Ensure compliance with RBI regulations and obtain necessary licenses before going live.

