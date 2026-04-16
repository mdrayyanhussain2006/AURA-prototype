/**
 * AURA Firestore Service — Renderer-side Firestore data fetcher.
 *
 * Fetches the `aura_modules` collection from Firestore.
 * All calls are async and wrapped in try/catch matching Phase A patterns.
 * Falls back gracefully if Firebase is unreachable (offline-first).
 */

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getDb } from './firebaseInit';

const MODULES_COLLECTION = 'aura_modules';

/**
 * Fetches all modules from the `aura_modules` Firestore collection.
 * Returns { ok, items } or { ok: false, error }.
 */
export async function fetchModules() {
  try {
    const db = getDb();
    const snapshot = await getDocs(collection(db, MODULES_COLLECTION));

    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || docSnap.id,
        shortDescription: data.shortDescription || '',
        fullDescription: data.fullDescription || '',
        status: data.status || 'Preview',
        purpose: data.purpose || 'General utility',
        actionLabel: data.actionLabel || 'View details',
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        version: data.version || '1.0.0',
        author: data.author || 'AURA Team',
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
      };
    });

    console.log(`[Firestore] Fetched ${items.length} modules from ${MODULES_COLLECTION}`);
    return { ok: true, items, source: 'firestore' };
  } catch (err) {
    console.warn('[Firestore] Failed to fetch modules:', err.message);
    return { ok: false, error: err.message, items: [], source: 'firestore' };
  }
}

/**
 * Fetches a single module by document ID.
 */
export async function fetchModuleById(moduleId) {
  if (!moduleId || typeof moduleId !== 'string') {
    return { ok: false, error: 'Module ID is required', item: null };
  }

  try {
    const db = getDb();
    const docRef = doc(db, MODULES_COLLECTION, moduleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { ok: false, error: 'Module not found in Firestore', item: null };
    }

    const data = docSnap.data();
    const item = {
      id: docSnap.id,
      title: data.title || docSnap.id,
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      status: data.status || 'Preview',
      purpose: data.purpose || 'General utility',
      actionLabel: data.actionLabel || 'View details',
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
      version: data.version || '1.0.0',
      author: data.author || 'AURA Team',
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null
    };

    return { ok: true, item, source: 'firestore' };
  } catch (err) {
    console.warn('[Firestore] Failed to fetch module by ID:', err.message);
    return { ok: false, error: err.message, item: null };
  }
}
