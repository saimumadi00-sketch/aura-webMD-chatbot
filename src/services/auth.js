import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

/**
 * Sign in anonymously, returns the user credential.
 */
export const signInAsGuest = async () => {
  const auth = getAuth();
  const cred = await signInAnonymously(auth);
  return cred;
};

/**
 * Subscribe to auth changes.
 * Example:
 *   const unsub = onAuthChange((user) => { ... });
 */
export const onAuthChange = (callback) => {
  const auth = getAuth();
  return onAuthStateChanged(auth, callback);
};
