# Payments App - System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │  Wallet  │  │  Send    │  │   QR     │   │
│  │  Screen  │  │  Screen  │  │  Money   │  │  Scanner │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Bills   │  │ Transaction│ │ Profile │  │ Contacts │   │
│  │  Screen  │  │  History  │  │ Screen  │  │  Screen  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / REST API
                            │ WebSocket (Real-time)
                            │
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API SERVER (Node.js/Express)            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Gateway / Express Router            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │ Payment  │  │   UPI    │  │   Bill   │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Wallet   │  │ Notification│  KYC     │  │   QR     │   │
│  │ Service  │  │   Service   │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          WebSocket Server (Socket.io)                │   │
│  │        Real-time transaction notifications            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Job Queue (Bull + Redis)                    │   │
│  │        Async tasks (OTP, notifications, etc.)        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │   Redis     │  │  AWS S3 /   │  │  Payment    │
│  Database   │  │   Cache     │  │  MinIO      │  │  Gateway    │
│             │  │             │  │  (Docs)     │  │  (Razorpay) │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  SMS     │  │   FCM    │  │   UPI    │  │   KYC    │   │
│  │ Gateway  │  │  Push    │  │ Network  │  │ Service  │   │
│  │(Twilio)  │  │ Notifications│(NPCI)   │  │(Razorpay)│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Send Money Transaction

```
User (Mobile App)
    │
    │ 1. Select contact, enter amount
    │ 2. Enter PIN
    ├─────────────────────────────────────►
    │                                     │
    │                             Backend API
    │                                     │
    │                                     │ 3. Validate PIN
    │                                     ├─────► Database
    │                                     │
    │                                     │ 4. Create transaction (PENDING)
    │                                     ├─────► Database
    │                                     │
    │                                     │ 5. Initiate UPI payment
    │                                     ├─────► Payment Gateway
    │                                     │
    │                                     │ 6. Process payment
    │ Payment Gateway                     │◄───── Payment Gateway
    │                                     │
    │                                     │ 7. Update wallet balances
    │                                     ├─────► Database
    │                                     │
    │ 8. Push notification (Success)      │
    │◄─────────────────────────────────────│
    │                                     │
    │ 9. Update UI, show success          │
    │                                     │
    │ Real-time update via WebSocket      │
    │◄─────────────────────────────────────│
```

## Authentication Flow

```
User opens app
    │
    │
    ▼
┌─────────────────┐
│  Check Token    │
│  (AsyncStorage) │
└─────────────────┘
    │
    │ Valid?
    ├─── Yes ──► Home Screen
    │
    └─── No ──► Login Screen
            │
            ├─── Option 1: Phone + PIN
            │    │
            │    └──► Verify PIN ──► Generate JWT ──► Home Screen
            │
            └─── Option 2: Biometric
                 │
                 └──► Verify Biometric ──► Generate JWT ──► Home Screen
```

## Technology Stack Summary

### Mobile App
- **React Native** with Expo
- **Redux Toolkit** for state management
- **React Navigation** for routing
- **React Native Paper** for UI components
- **React Native Firebase** for push notifications
- **React Native QR Scanner** for QR code scanning

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Prisma ORM** for database access
- **JWT** for authentication
- **Socket.io** for WebSocket connections
- **Bull** for job queues
- **Winston** for logging

### Database & Cache
- **PostgreSQL** - Primary database
- **Redis** - Caching and job queues

### Infrastructure
- **Docker** for containerization
- **AWS/DigitalOcean** for hosting
- **Nginx** as reverse proxy
- **Let's Encrypt** for SSL certificates

### Third-Party Services
- **Razorpay** - Payment gateway & UPI
- **Twilio/AWS SNS** - SMS/OTP service
- **Firebase Cloud Messaging** - Push notifications
- **Razorpay KYC API** - KYC verification

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Mobile App Security                        │
│  - PIN encryption (AES)                              │
│  - Biometric authentication                          │
│  - Secure storage (Keychain/Keystore)               │
│  - Certificate pinning                               │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2: Network Security                           │
│  - TLS 1.3 encryption                                │
│  - JWT token authentication                          │
│  - Rate limiting                                     │
│  - DDoS protection                                   │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3: API Security                               │
│  - Input validation (Zod)                           │
│  - SQL injection prevention (Prisma)                │
│  - XSS protection                                    │
│  - CORS configuration                                │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Layer 4: Database Security                          │
│  - Encrypted sensitive fields                        │
│  - Hashed passwords/PINs                             │
│  - Database backups                                  │
│  - Access control                                    │
└─────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
User
  ├── Wallet (1:1)
  ├── BankAccount (1:many)
  ├── UpiId (1:1)
  ├── Transaction (1:many)
  ├── Contact (1:many)
  └── SavedBill (1:many)

Transaction
  ├── User (many:1)
  ├── Wallet (many:1)
  ├── BankAccount (many:1, from/to)
  └── QrCode (many:1)

QrCode
  └── Transaction (1:many)

Merchant
  └── Transaction (1:many)

BillCategory
  └── SavedBill (1:many)
```

## API Response Examples

### Get Wallet Balance
```json
{
  "success": true,
  "data": {
    "balance": 5000.00,
    "currency": "INR",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### Transaction Response
```json
{
  "success": true,
  "data": {
    "transactionId": "TXN123456789",
    "type": "P2P",
    "status": "SUCCESS",
    "amount": 500.00,
    "to": {
      "name": "John Doe",
      "phoneNumber": "+919876543210",
      "upiId": "john@payapp"
    },
    "description": "Payment for lunch",
    "timestamp": "2024-01-15T10:30:00Z",
    "upiReferenceId": "UPIR123456789"
  }
}
```

### QR Code Generation
```json
{
  "success": true,
  "data": {
    "qrCodeId": "QR123456",
    "qrImageUrl": "https://api.payapp.com/qr/QR123456.png",
    "upiString": "upi://pay?pa=user@payapp&pn=User+Name&am=500.00&cu=INR",
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Production Environment              │
│                                                       │
│  ┌──────────────┐         ┌──────────────┐          │
│  │   Load       │         │   Load       │          │
│  │  Balancer    │────────►│  Balancer    │          │
│  │  (Nginx)     │         │  (Nginx)     │          │
│  └──────────────┘         └──────────────┘          │
│         │                      │                     │
│         ▼                      ▼                     │
│  ┌──────────────┐         ┌──────────────┐          │
│  │  API Server  │         │  API Server  │          │
│  │  Instance 1  │         │  Instance 2  │          │
│  └──────────────┘         └──────────────┘          │
│         │                      │                     │
│         └──────────┬───────────┘                     │
│                    ▼                                 │
│         ┌──────────────────────┐                     │
│         │  PostgreSQL Primary  │                     │
│         │  (Read/Write)        │                     │
│         └──────────────────────┘                     │
│                    │                                 │
│                    ▼                                 │
│         ┌──────────────────────┐                     │
│         │  PostgreSQL Replica  │                     │
│         │  (Read-only)         │                     │
│         └──────────────────────┘                     │
│                                                      │
│  ┌──────────────┐         ┌──────────────┐          │
│  │    Redis     │         │  File Storage│          │
│  │  (Cluster)   │         │  (S3/MinIO)  │          │
│  └──────────────┘         └──────────────┘          │
└──────────────────────────────────────────────────────┘
```

## Monitoring & Logging

```
┌─────────────────────────────────────────────────────┐
│              Monitoring Stack                        │
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │  Prometheus  │────────►│   Grafana    │         │
│  │  (Metrics)   │         │  (Dashboards)│         │
│  └──────────────┘         └──────────────┘         │
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Winston    │────────►│    ELK       │         │
│  │  (Logging)   │         │  (Log View)  │         │
│  └──────────────┘         └──────────────┘         │
│                                                      │
│  ┌──────────────┐                                   │
│  │    Sentry    │                                   │
│  │ (Error Track)│                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **React Native over Native**: Faster development, code reuse, easier maintenance
2. **PostgreSQL**: ACID compliance, relational data integrity, complex queries
3. **Redis**: Fast caching, session storage, job queues
4. **Razorpay**: Easy integration, reliable, good documentation
5. **JWT Authentication**: Stateless, scalable, secure
6. **WebSocket**: Real-time notifications for better UX
7. **Job Queue**: Handle async tasks (OTP, emails) reliably
8. **Prisma ORM**: Type-safe, migrations, good developer experience

## Scalability Considerations

1. **Horizontal Scaling**: Load balancer + multiple API instances
2. **Database Read Replicas**: Distribute read queries
3. **Redis Clustering**: Handle high cache load
4. **CDN**: Serve static assets globally
5. **Database Indexing**: Optimize query performance
6. **Connection Pooling**: Efficient database connections
7. **Caching Strategy**: Reduce database load
8. **Rate Limiting**: Prevent abuse and ensure fair usage

