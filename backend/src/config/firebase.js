import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { env } from './env.js';

let isFirebaseConnected = false;
let db = null;
let auth = null;
let bucket = null;

try {
  let credential = null;

  // 1. Try from raw JSON string in environment variable (Render / Railway / Cloud Run)
  if (env.FIREBASE.SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(env.FIREBASE.SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
    } catch (parseErr) {
      console.warn('⚠️ [Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseErr.message);
    }
  }

  // 2. Try from specific service account file path
  if (!credential && env.FIREBASE.SERVICE_ACCOUNT_PATH && fs.existsSync(env.FIREBASE.SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(env.FIREBASE.SERVICE_ACCOUNT_PATH, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
  }
  // 3. Try from root serviceAccountKey.json if present
  else if (!credential) {
    const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(localKeyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    }
  }

  // 3. Try from environment variables
  if (!credential && env.FIREBASE.CLIENT_EMAIL && env.FIREBASE.PRIVATE_KEY) {
    credential = admin.credential.cert({
      projectId: env.FIREBASE.PROJECT_ID,
      clientEmail: env.FIREBASE.CLIENT_EMAIL,
      privateKey: env.FIREBASE.PRIVATE_KEY,
    });
  }

  // 4. Try application default credentials
  if (!credential && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = admin.credential.applicationDefault();
  }

  if (credential) {
    admin.initializeApp({
      credential,
      projectId: env.FIREBASE.PROJECT_ID,
      storageBucket: env.FIREBASE.STORAGE_BUCKET,
    });
    db = admin.firestore();
    auth = admin.auth();
    bucket = admin.storage().bucket();
    isFirebaseConnected = true;
    console.log('🔥 [Firebase Admin] Successfully connected to Firebase Project via Service Account:', env.FIREBASE.PROJECT_ID);
  } else if (env.FIREBASE.PROJECT_ID) {
    // Initialize Firebase Admin SDK with project parameters
    admin.initializeApp({
      projectId: env.FIREBASE.PROJECT_ID,
      storageBucket: env.FIREBASE.STORAGE_BUCKET,
    });
    db = admin.firestore();
    auth = admin.auth();
    bucket = admin.storage().bucket();
    isFirebaseConnected = true;
    console.log('🔥 [Firebase Admin] Successfully initialized with Firebase Project ID:', env.FIREBASE.PROJECT_ID);
  } else {
    console.warn('⚠️ [Firebase Admin] No Firebase Project configuration found.');
  }
} catch (error) {
  console.warn('⚠️ [Firebase Admin Initialization Note]:', error.message);
}

export { admin, db, auth, bucket, isFirebaseConnected };
