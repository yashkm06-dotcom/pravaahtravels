# Pravaah Travels - Firebase & Hosting Deployment Guide

This document describes how to set up, configure, and deploy the Pravaah Travels website into your production Firebase environment.

---

## 1. Firebase Project Setup

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `pravaah-travels` (or any name you prefer).
3. (Optional) Choose whether to enable Google Analytics, then click **Create project**.

---

## 2. Enable Firebase Products

### A. Authentication
1. In the left navigation, click **Build** > **Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, select **Email/Password** and click **Enable**, then save.

### B. Cloud Firestore
1. Click **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (or test mode, though our rules are robust and secure).
4. Set your cloud location (e.g. `us-central` or `asia-south1`) and click **Enable**.

### C. Firebase Storage
1. Click **Build** > **Storage**.
2. Click **Get Started**.
3. Click **Next** and **Done** with default locations.

---

## 3. Environment Variables Configuration

Vite loads environment variables starting with the `VITE_` prefix. You can customize them in your local `.env` file or within your hosting provider’s dashboard:

```env
VITE_FIREBASE_API_KEY="YOUR_API_KEY_HERE"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_APP_ID"
VITE_FIREBASE_DATABASE_ID="(default)" # Or your named firestore database ID
```

---

## 4. Security Rules Deployment

The project contains pre-configured security rules that protect client enquiries and travel packages from public tempering.

### Deploy Firestore Security Rules:
Using the Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

Or copy the contents of `firestore.rules` directly into the **Rules** tab inside your Cloud Firestore console!

---

## 5. Hosting Deployment

To deploy the static React + Vite build to Firebase Hosting:

1. Initialize Firebase in your local directory:
   ```bash
   firebase init hosting
   ```
2. Configure settings:
   - What do you want to use as your public directory? **`dist`**
   - Configure as a single-page app (rewrite all urls to /index.html)? **`Yes`**
   - Set up automatic builds and deploys with GitHub? **`No` (or Yes if preferred)**
   - Overwrite existing `index.html`? **`No`**

3. Build the React app:
   ```bash
   npm run build
   ```

4. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

Your beautiful, premium travel agency website will now be live on `https://your-project-id.web.app`!
