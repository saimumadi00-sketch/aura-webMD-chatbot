/*
 * Optional direct Firebase auth helpers used by AuthGate and GuestLoginButton; the main account flow uses FirebaseService.
 */

import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseEnabled } from "./firebase";

/**
 * Sign in anonymously, returns the user credential.
 */
export const signInAsGuest = async () => {
  if (!isFirebaseEnabled || !auth) throw new Error("Firebase is not configured.");
  const cred = await signInAnonymously(auth);
  return cred;
};

/**
 * Subscribe to auth changes.
 * Example:
 *   const unsub = onAuthChange((user) => { ... });
 */
export const onAuthChange = (callback) => {
  if (!isFirebaseEnabled || !auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
};
