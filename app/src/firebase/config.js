// ---------------------------------------------------------------------------
// Firebase initialization
// ---------------------------------------------------------------------------
// The values in `firebaseConfig` below are ACCOUNT-SPECIFIC and cannot be
// pre-filled. Create a free Firebase project (Spark tier is fine), enable
// Email/Password authentication and Cloud Firestore, then copy your web app's
// config object from:
//   Firebase console -> Project settings -> Your apps -> Web app -> SDK setup
// and paste the values here. Nothing else in the codebase needs to change.
// ---------------------------------------------------------------------------

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: '1:YOUR_SENDER_ID:web:ee8bcc43241b9a28da52dd',
  measurementId: 'YOUR_MEASUREMENT_ID',
};

// Avoid re-initializing on Fast Refresh / repeated imports.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth must be initialized with React Native persistence so users stay logged
// in between app launches. initializeAuth throws if called twice, so fall back
// to getAuth on subsequent evaluations.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

/**
 * Returns true when the developer has not yet pasted their own Firebase keys.
 * The UI uses this to show a friendly setup notice instead of a cryptic
 * network error.
 */
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'YOUR_PROJECT_ID'
  );
}

export { app, auth, db, storage };
