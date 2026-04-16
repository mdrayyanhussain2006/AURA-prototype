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
  apiKey: 'AIzaSyB2k4jxdhLhL5H9HceuuiDuGsbqu6DVADM',
  authDomain: 'aura-vault-49d27.firebaseapp.com',
  projectId: 'aura-vault-49d27',
  storageBucket: 'aura-vault-49d27.firebasestorage.app',
  messagingSenderId: '924019989743',
  appId: '1:924019989743:web:f7b377f5a2f1539ac04f1a',
  measurementId: 'G-SFSQ9TQS39'
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
