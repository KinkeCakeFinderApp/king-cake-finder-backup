// ---------------------------------------------------------------------------
// Firebase — connects to the SAME project as the mobile app (do not create a
// new database). These are the same web config values used by the Expo app, so
// bakeries/users/reviews are shared across app and website.
//
// To point at your own project, replace the values below with your Firebase web
// app config (Firebase console -> Project settings -> Your apps -> Web app).
// ---------------------------------------------------------------------------

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: '1:YOUR_SENDER_ID:web:ee8bcc43241b9a28da52dd',
  measurementId: 'YOUR_MEASUREMENT_ID',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Web auth uses browserLocalPersistence by default, so sessions persist.
export const auth = getAuth(app);
export const db = getFirestore(app);

export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith('YOUR_') &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith('YOUR_')
  );
}

export { app };
