# 🚀 Deploying MeetFame on Vercel as a Single Project

This repository is configured to deploy as a **single unified Vercel project** containing:
1. **Frontend**: Public Landing Page, User Portal & Influencer Dashboard at `/`
2. **Admin Command Center**: Management portal at `/admin`
3. **Backend API**: Serverless Express API running at `/api/*`
4. **Cloud Database**: MongoDB Atlas cluster
5. **Vercel Blob Storage**: Cloud storage for certificate uploads & creator media

---

## 📋 Step-by-Step Vercel Deployment Guide

### Step 1: Push Code to GitHub / Git Provider
Make sure your latest code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure single project Vercel deployment with Blob storage and MongoDB"
git push origin main
```

---

### Step 2: Import Project in Vercel Dashboard
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
2. Select your `meet-fame` repository and click **"Import"**.
3. In the project setup screen:
   - **Framework Preset**: Leave as **Other** (Vercel will detect `vercel.json`).
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `npm run build` (detected automatically).
   - **Output Directory**: `dist` (detected automatically).

---

### Step 3: Attach Vercel Blob Storage
1. In your Vercel Project dashboard, go to the **Storage** tab.
2. Click **"Create Database"** / **"Create Blob Store"**.
3. Name your store (e.g. `meetfame-storage`).
4. Choose **Read-Write** and click **Create**.
5. Once created, click **"Connect Project"** to attach it to your `meet-fame` project.
   - Vercel automatically injects `BLOB_READ_WRITE_TOKEN` into your project's Environment Variables!

---

### Step 4: Configure Environment Variables in Vercel
In your Vercel Project -> **Settings** -> **Environment Variables**, add the following:

| Key | Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://vishalkaushalit_db_user:iybDJ7XRhQVs9JKk@meet-fame-db.keuvht8.mongodb.net/meetfame?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `meetfame_super_secret_jwt_key_production_2026` | Custom JWT secret for auth sessions |
| `BLOB_READ_WRITE_TOKEN` | *(Automatically added when you attach Blob Store in Step 3)* | Required for Vercel Blob uploads |

---

### Step 5: Click "Deploy"
1. Click **Deploy**.
2. Vercel will run `npm run build`, packaging the frontend, admin panel, and serverless API.
3. Once deployed, your project URL will be generated (e.g., `https://meet-fame-xxxx.vercel.app`).

---

## 🌐 Live URL Structure on Vercel

| Section | Route | Description |
|---|---|---|
| **Main Website** | `https://your-domain.vercel.app/` | Landing page, user slot booking & influencer dashboard |
| **Admin Command Center** | `https://your-domain.vercel.app/admin` | Admin approvals, slot inspector, bookings & chats |
| **Backend API** | `https://your-domain.vercel.app/api/*` | Serverless Express API connected to MongoDB Atlas |
| **Vercel Blob Storage** | CDN URLs | Fast public URLs for uploaded certificates & media |

---

## 🔑 Default Accounts

- **Admin Login**: `admin@meetfame.com` / `admin123` (at `/admin`)
- **Verified Influencer**: `marcus@techcreator.io` / `password123` (at `/`)
- **Pending Review Influencer**: `kavita@angelvc.in` / `password123` (Triggers review popup)
- **User / Fan**: `alex@example.com` / `password123`


## Persistent booking storage

Set a working `MONGODB_URI` in the Vercel project's Production environment and redeploy. Use a MongoDB replica set (MongoDB Atlas supports transactions). The API uses MongoDB for account, booking, notification, and message records; local development without a URI continues to use JSON storage.

On first use, empty collections import retained JSON records. Existing MongoDB records are preserved. Legacy accounts without string IDs retain their matching local ID by email. Unique indexes prevent duplicate IDs and concurrent reservations of the same active slot. Multi-record changes commit in a transaction before the API sends a successful response. Unavailable storage returns 503 rather than silently accepting an ephemeral booking.

`/api/health` should report `mongoConnected: true` after startup. Then verify a new booking from the user, influencer, admin panel, and a fresh browser session. A booking absent from the deployed API cannot be restored automatically; do not create replacement reservations without confirming their date and time.
