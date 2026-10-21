# MeetFame | Connect • Book • Meet

MeetFame is an influencer booking and 1-on-1 consultation web platform featuring automated 1-hour slot generation, collision-free slot booking with disabled booked slots, an Instagram-style Blue Verified Badge credential review system, and a dedicated Admin Command Center.

---

## 📁 Project Architecture (3 Separate Folders)

The application is structured into 3 distinct folders:

```
meet-fame/
├── backend/       # Express + MongoDB Atlas + Vercel Blob Storage API
│   ├── .env       # Connected to MongoDB Atlas & Vercel Blob token
│   ├── src/       # Models, Slot generator, Auth, Bookings, Admin & Chat APIs
│   └── vercel.json
├── frontend/      # React + Tailwind CSS (Landing Page, User Panel, Influencer Panel)
│   ├── .env       # API configuration
│   ├── src/       # Components, slot selector dropdown, live chat, verified badges
│   └── vercel.json
└── web-panel/     # React + Tailwind CSS (Admin Command Center)
    ├── .env       # Admin portal environment
    ├── src/       # Approvals, Slots Inspector, Bookings, Conversations monitor
    └── vercel.json
```

---

## 🚀 Live Local Ports

| Service | Port / URL | Description |
|---|---|---|
| **Backend API** | `http://localhost:5001` | Express REST API connected to MongoDB Atlas |
| **Frontend** | `http://localhost:5173` | Landing page, User Portal & Influencer Dashboard |
| **Web Panel** | `http://localhost:5174` | Admin Command Center (Approvals, Slots & Chats) |

---

## 🔑 Demo Logins & Roles

### 1. Admin Role (Web Panel - Port 5174)
- **URL**: [http://localhost:5174](http://localhost:5174)
- **Email**: `admin@meetfame.com`
- **Password**: `admin123`
- *(Includes a 1-Click Quick Login button)*

### 2. Influencer Role (Frontend - Port 5173)
- **Marcus Vance (Approved & Verified Creator)**:
  - **Email**: `marcus@techcreator.io`
  - **Password**: `password123`
- **Kavita Patel (Pending Review - Test Popup Modal)**:
  - **Email**: `kavita@angelvc.in`
  - **Password**: `password123`
  - *When attempted, triggers the modal popup: "Your account is under review by the admin. You will be able to access your dashboard once approved."*

### 3. User Role (Frontend - Port 5173)
- **Alex Rivera**:
  - **Email**: `alex@example.com`
  - **Password**: `password123`

---

## ⚙️ Environment Setup

Configure each application's environment privately using local environment files or your deployment provider's settings. Keep credentials, tokens, connection strings, and secret values out of this README and version control.

---

## 🌟 Key Features Implemented

1. **Brand Identity & Typography**:
   - Palette from the official logo: Indigo (`#6366F1`), Purple (`#8B5CF6`), Pink (`#EC4899`), Coral-Orange (`#FF5E62`), and Slate Navy (`#0A0F1D`).
   - Geometric rounded sans-serif font family: `'Plus Jakarta Sans'` & `'Outfit'`.
   - SVG Infinity Logo with video camera and interconnected heads.

2. **1-Hour Slots Auto-Generation Engine**:
   - Single slot duration is strictly 1 hour.
   - Example: Influencer enters Monday availability `09:00 - 12:00` and `17:00 - 20:00`.
   - The engine automatically computes:
     - `09:00 - 10:00` (9:00 AM - 10:00 AM)
     - `10:00 - 11:00` (10:00 AM - 11:00 AM)
     - `11:00 - 12:00` (11:00 AM - 12:00 PM)
     - `17:00 - 18:00` (5:00 PM - 6:00 PM)
     - `18:00 - 19:00` (6:00 PM - 7:00 PM)
     - `19:00 - 20:00` (7:00 PM - 8:00 PM)

3. **Booking Collision Prevention**:
   - When a user selects a date to book an influencer, already booked slots are displayed in the dropdown marked as `[Already Booked]` and **disabled** from selection.

4. **Under-Review Status Flow**:
   - Influencers register with specialization credentials and day-wise time availability.
   - Registration immediately displays: *"Your account is under review by the admin"*.
   - When an unapproved influencer attempts to login, a modal popup informs them that their account is under review.
   - Once approved by Admin in the web panel, the influencer gains instant login access to their dashboard.

5. **Instagram-Style Blue Verified Badge**:
   - Influencers can upload specialization certificates (supports Vercel Blob storage).
   - Admin reviews the certificate in the Admin Approvals queue and clicks *"Verify Certificate & Grant Instagram Badge"*.
   - Verified creators receive the blue checkmark badge across search, cards, booking screens, and chats.

6. **Admin Command Center (`web-panel`)**:
   - **Approvals Center**: Approve or decline Influencers & Users, review credentials, toggle verified badges.
   - **Slots Inspector**: Choose any influencer and date to view **Available Slots** and **Booked Slots** (with attendee details and consultation topics).
   - **Bookings Central**: Full log of confirmed sessions, volume ($), meeting types, and statuses.
   - **Conversations Monitor**: Read live conversations between users and influencers.

---

## 🛠️ Running the Projects

In three separate terminal windows:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (User & Influencer)
cd frontend
npm run dev

# Terminal 3: Admin Web Panel
cd web-panel
npm run dev
```