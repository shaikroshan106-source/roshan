# AGRIDIRECT Backend Server

Production-ready backend for the AGRIDIRECT agricultural trading platform, built with **Node.js**, **Express.js**, **REST APIs**, **Firebase Authentication**, **Cloud Firestore**, and **Firebase Storage**.

---

## Features

1. **Farmer Services**: Produce lot publishing, AI scanner certificates, bid acceptance, revenue analytics, price predictions.
2. **Buyer Services**: Marketplace browsing, auction bidding with real-time price validation, featured lot matching, order tracking.
3. **Admin Moderation**: Platform telemetry, dispute desk arbitration, 1-click counterparty suspension, fraudulent listing & bid purging.
4. **Marketplace & Auctions**: Full CRUD for crop listings, real-time bid updates, deal confirmation and price locking.
5. **Grievance Desk**: Dispute filing with role-based categories, severity levels, photographic evidence upload, and status workflows.
6. **FarmAI Intelligence**: Price prediction, 12-month demand/supply curves, buyer matching ranking, route optimization, and chat NLP.
7. **Firebase Integration**: Firebase Admin SDK token authentication, Firestore document storage, and Firebase Storage bucket uploads.

---

## Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js                # Environment variables loader
│   │   └── firebase.js           # Firebase Admin SDK initialization with auto-fallback
│   ├── controllers/
│   │   ├── authController.js     # Session verification & demo login
│   │   ├── listingController.js  # Marketplace crop lots
│   │   ├── bidController.js      # Live auction bidding & acceptance
│   │   ├── complaintController.js# Grievance desk & arbitration
│   │   ├── adminController.js    # Moderation & platform telemetry
│   │   ├── aiController.js       # Price forecasting & buyer matching
│   │   ├── logisticsController.js# Route optimization & live tracking
│   │   └── notificationController.js # In-app notifications
│   ├── middleware/
│   │   ├── auth.js               # Firebase ID token & demo token verification
│   │   ├── rbac.js               # Role-based access control ('farmer', 'buyer', 'admin')
│   │   ├── upload.js             # Multer upload handler (10MB, images & PDFs)
│   │   ├── rateLimiter.js        # Express rate limiter
│   │   └── errorHandler.js       # Centralized error handler
│   ├── routes/                   # Route modules mounted under /api/*
│   ├── seeds/
│   │   └── seedData.js           # Automated initial data seeder
│   ├── services/
│   │   ├── firestoreService.js   # Cloud Firestore / local persistence engine
│   │   ├── storageService.js     # Firebase Storage / static file uploader
│   │   └── aiService.js          # Agritech analytical algorithms
│   ├── app.js                    # Express application configuration
│   └── server.js                 # Server entry point (:5000)
├── .env.example
├── .env
└── package.json
```

---

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

To connect your live Firebase project, place your downloaded `serviceAccountKey.json` from the Firebase Console in the `backend/` folder. The backend automatically detects it!

### 3. Run the Backend
```bash
npm start
# or with auto-reload:
npm run dev
```

The server will start at `http://localhost:5000`.
Healthcheck: `http://localhost:5000/api/health`

---

## REST API Endpoints

### Auth & Profiles (`/api/auth`)
- `POST /api/auth/demo-login`: 1-Click demo credentials for Farmer, Buyer, or Admin
- `GET /api/auth/session`: Validates current Firebase ID Token session
- `GET /api/auth/profile`: Retrieves current user profile
- `PATCH /api/auth/profile`: Updates profile details

### Marketplace Listings (`/api/listings`)
- `GET /api/listings`: Filter by `crop`, `location`, `grade`, `search`, `sortBy`
- `GET /api/listings/:id`: Lot details with AI inspection certificate and bids
- `POST /api/listings`: `[Farmer]` Create lot with optional image upload
- `PATCH /api/listings/:id`: `[Farmer/Admin]` Update lot
- `DELETE /api/listings/:id`: `[Farmer/Admin]` Delete lot

### Bidding Engine (`/api/bids`)
- `GET /api/bids`: All bids (optional filter `?lotId=...`)
- `GET /api/bids/lot/:lotId`: Chronological & highest bids for an auction
- `POST /api/bids`: `[Buyer]` Place offer (validates amount > highest)
- `POST /api/bids/accept`: `[Farmer]` Accept bid & lock deal

### Grievance Desk (`/api/complaints`)
- `GET /api/complaints`: Retrieve grievances (Admin sees all; users see own)
- `POST /api/complaints`: Submit dispute with evidence photo upload
- `PATCH /api/complaints/:id/status`: `[Admin]` Update status with notes
- `POST /api/complaints/:id/suspend-counterparty`: `[Admin]` 1-Click suspension

### Admin Moderation (`/api/admin`)
- `GET /api/admin/overview`: Telemetry stats (users, volume, accuracy, tickets)
- `DELETE /api/admin/listings/:lotId`: Flag & purge fraudulent listing
- `DELETE /api/admin/bids/:bidId`: Purge fraudulent/shill bid
- `GET /api/admin/users`: User roster
- `PATCH /api/admin/users/:uid/status`: Update account status (active/suspended)

### FarmAI Services (`/api/ai`)
- `POST /api/ai/predict-price`: Body `{ crop, location }`
- `POST /api/ai/match-buyers`: Body `{ lotId }`
- `GET /api/ai/forecast-demand`: Query `?crop=Tomato&region=Guntur`
- `POST /api/ai/optimize-profit`: Body `{ lotId }`
- `POST /api/ai/optimize-route`: Body `{ pickup, drop }`
- `POST /api/ai/chat`: Multi-lingual chatbot response
