/*
 * Firebase adapter: initialize only with usable public config and expose real or fallback auth/persistence methods.
 */

// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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

  const shouldInitAnalytics = isBrowser && firebaseConfig?.measurementId;
  if (shouldInitAnalytics) {
    try {
      analyticsInstance = getAnalytics(app);
    } catch (err) {
      console.warn("Firebase analytics disabled:", err?.message || err);
    }
  } else if (!firebaseConfig?.measurementId) {
    console.warn("Firebase analytics skipped: missing VITE_FB_MEASUREMENT_ID.");
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

export const analytics = analyticsInstance;
export const auth = authInstance;
export { isFirebaseEnabled };
export default FirebaseService;
