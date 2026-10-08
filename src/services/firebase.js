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
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { FIREBASE_CONFIG } from "../config/constants";

// --- CONFIG & SAFETY GUARDS ---
const firebaseConfig = FIREBASE_CONFIG;
const isBrowser = typeof window !== "undefined";
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
const AuthService = isFirebaseEnabled
  ? {
      onAuthStateChanged: (callback) => onAuthStateChanged(authInstance, callback),
      createUser: (email, password) => createUserWithEmailAndPassword(authInstance, email, password),
      signIn: (email, password) => signInWithEmailAndPassword(authInstance, email, password),
      signOut: () => signOut(authInstance),
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
      signOut: async () => undefined,
      updateProfile: async () => undefined,
    };

// --- FIRESTORE HELPERS (minimal) ---
const FirestoreService = isFirebaseEnabled
  ? {
      serverTimestamp: serverTimestampSafe,
      addMessage: (userId, message) =>
        addDoc(collection(db, "users", userId, "messages"), message),
      clearMessages: async (userId) => {
        const ref = collection(db, "users", userId, "messages");
        const snapshot = await getDocs(ref);
        await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
      },
      updateMessage: (messageRef, data) => updateDoc(messageRef, data),
      savePreferences: (userId, prefs) =>
        setDoc(doc(db, "users", userId, "preferences"), prefs),
      subscribeToMessages: (userId, callback) =>
        onSnapshot(collection(db, "users", userId, "messages"), callback),
      subscribeToPreferences: (userId, callback) =>
        onSnapshot(doc(db, "users", userId, "preferences"), callback),
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
