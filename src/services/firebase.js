/*
 * Firebase adapter: initialize only with usable public config and expose real or fallback auth/persistence methods.
 */

// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { readAnalyticsConsent } from './analytics-consent';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { FIREBASE_CONFIG } from "../config/constants";

// --- CONFIG & SAFETY GUARDS ---
const firebaseConfig = FIREBASE_CONFIG;
const isBrowser = typeof window !== "undefined";
// Guard against empty/example config; this does not verify Firebase access or deployed rules.
const hasValue = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  !value.includes("YOUR_PROJECT_ID") &&
  !value.includes("YOUR_FIREBASE_APP_ID");
const isFirebaseEnabled =
  hasValue(firebaseConfig?.apiKey) &&
  hasValue(firebaseConfig?.projectId) &&
  hasValue(firebaseConfig?.appId);

// --- INIT ---
let app = null;
let analyticsInstance = null;
let authInstance = null;
let db = null;
let storage = null;

if (isFirebaseEnabled) {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  if (isBrowser && firebaseConfig?.measurementId) {
    let generation = 0;
    const applyConsent = async granted => {
      const current = ++generation;
      if (!granted && !analyticsInstance) return;
      try {
        const api = await import('firebase/analytics');
        if (current !== generation) return;
        if (!granted) {
          api.setAnalyticsCollectionEnabled(analyticsInstance, false);
          api.setConsent({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
          // Remove this site's analytics cookies when consent is withdrawn.
          for (const cookie of document.cookie.split(';')) {
            const name = cookie.split('=')[0].trim();
            if (/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) {
              document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
              const parts = location.hostname.split('.');
              for (let i = 0; i < parts.length - 1; i++) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${parts.slice(i).join('.')}; SameSite=Lax`;
            }
          }
          return;
        }
        if (!await api.isSupported() || current !== generation) return;
        // Disable default page views and advertising signals; turn off enhanced measurement in the GA property before launch.
        if (!analyticsInstance) analyticsInstance = api.initializeAnalytics(app, { config: { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false } });
        api.setConsent({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        api.setAnalyticsCollectionEnabled(analyticsInstance, true);
        api.logEvent(analyticsInstance, 'page_view', { page_location: location.origin + location.pathname, page_title: 'Aura' });
      } catch { console.warn('Optional analytics is unavailable.'); }
    };
    applyConsent(readAnalyticsConsent());
    window.addEventListener('aura-analytics-consent', event => applyConsent(event.detail === true));
    window.addEventListener('storage', event => { if (event.key === 'aura-analytics-consent') applyConsent(readAnalyticsConsent()); });
  }
} else {
  console.warn("Firebase config missing or placeholder values. Running in guest/local-only mode.");
}

const serverTimestampSafe = () =>
  isFirebaseEnabled ? serverTimestamp() : Date.now();

// --- AUTH HELPERS ---
// Match the adapter shape in both modes so callers need no separate implementation.
const AuthService = isFirebaseEnabled
  ? {
      onAuthStateChanged: (callback) => onAuthStateChanged(authInstance, callback),
      createUser: (email, password) => createUserWithEmailAndPassword(authInstance, email, password),
      signIn: (email, password) => signInWithEmailAndPassword(authInstance, email, password),
      signOut: () => signOut(authInstance),
      resetPassword: (email) => sendPasswordResetEmail(authInstance, email),
      updateProfile: (user, data) => updateProfile(user, data),
    }
  : {
      onAuthStateChanged: () => () => {},
      createUser: async () => {
        throw new Error("Firebase is not configured. Provide VITE_FB_* values to enable auth.");
      },
      signIn: async () => {
        throw new Error("Firebase is not configured. Provide VITE_FB_* values to enable auth.");
      },
      resetPassword: async () => { throw new Error("Firebase is not configured."); },
      signOut: async () => undefined,
      updateProfile: async () => undefined,
    };

// --- FIRESTORE HELPERS (minimal) ---
const FirestoreService = isFirebaseEnabled
  ? {
      serverTimestamp: serverTimestampSafe,
      addMessage: async (userId, message, messageId) => {
        if (!messageId) return addDoc(collection(db, "users", userId, "messages"), message);
        // Stable IDs reconcile optimistic/streamed messages with subscription updates.
        const ref = doc(db, "users", userId, "messages", messageId);
        await setDoc(ref, message);
        return ref;
      },
      // Delete each active message document; archived conversations remain in local storage.
      clearMessages: async (userId) => {
        const ref = collection(db, "users", userId, "messages");
        const snapshot = await getDocs(ref);
        await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
      },
      updateMessage: (messageRef, data) => updateDoc(messageRef, data),
      // Preferences live in a single settings document beneath the user-owned collection.
      savePreferences: (userId, prefs) =>
        setDoc(doc(db, "users", userId, "preferences", "settings"), prefs),
      subscribeToMessages: (userId, callback, onError) =>
        onSnapshot(query(collection(db, "users", userId, "messages"), orderBy("createdAt", "asc")), callback, onError),
      subscribeToPreferences: (userId, callback, onError) =>
        onSnapshot(doc(db, "users", userId, "preferences", "settings"), callback, onError),
    }
  : {
      serverTimestamp: serverTimestampSafe,
      addMessage: async () => undefined,
      clearMessages: async () => undefined,
      updateMessage: async () => undefined,
      savePreferences: async () => undefined,
      subscribeToMessages: () => () => {},
      subscribeToPreferences: () => () => {},
    };

// --- EXPORT WRAPPER ---
const FirebaseService = {
  auth: AuthService,
  firestore: FirestoreService,
  storage,
  serverTimestamp: serverTimestampSafe,
};

export { analyticsInstance as analytics };
export const auth = authInstance;
export { isFirebaseEnabled };
export default FirebaseService;
