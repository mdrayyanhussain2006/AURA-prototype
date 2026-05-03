/**
 * AURA Firebase Init — Renderer-only Firebase app initialization.
 *
 * Firebase Web SDK runs in the renderer (browser environment).
 * This module is the single source of truth for the Firebase app instance.
 * DO NOT import this file in the main process.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = Object.freeze({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

let _app = null;
let _db = null;
let _auth = null;

export function getFirebaseApp() {
  if (!_app) {
    _app = initializeApp(firebaseConfig);
    console.log('[Firebase] App initialized:', firebaseConfig.projectId);
  }
  return _app;
}

export function getDb() {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

export function getFirebaseAuth() {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export { firebaseConfig };
