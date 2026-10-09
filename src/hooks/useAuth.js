/*
 * Account lifecycle: subscribe to Firebase, expose authentication actions, and maintain a separate local guest mode.
 */

import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseEnabled } from "../services/firebase";
import { useEffect, useState } from "react";
import FirebaseService from "../services/firebase";

export const useAuth = () => {
    const [user, setUser] = useState(null); // { uid, displayName, email, isGuest? }
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [view, setView] = useState("welcome");

    const isGuest = !!user?.isGuest;

    // Resolve persisted Firebase identity before the UI treats auth as ready. Guests skip it.
    useEffect(() => {
        if (isGuest || !isFirebaseEnabled || !auth) {
            setIsAuthReady(true);
            return;
        }

        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                setUserId(u.uid);
                setView("chat");
            } else {
                setUser(null);
                setUserId(null);
                setView("welcome");
            }
            setIsAuthReady(true);
        });

        return () => unsub();
    }, [isGuest]);

    const goWelcome = () => setView("welcome");
    const goLogin = () => setView("auth-login");
    const goRegister = () => setView("auth-register");
    const goChat = () => setView("chat");
    const goPreferences = () => setView("preferences");
    const goBilling = () => setView("billing");

    const startGuest = () => {
        // This is a local guest profile, not Firebase anonymous authentication.
        setError(null);
        setNotice(null);
        setUser({ uid: "guest", displayName: "Guest", isGuest: true });
        setUserId("guest");
        setView("chat");
    };

    // Create the Firebase account first, then attach its display name for the chat UI.
    const handleRegister = async (email, password, username) => {
        if (!isFirebaseEnabled) {
            setError("Account creation is disabled because Firebase is not configured.");
            return false;
        }
        if (!email || !password || !username) {
            setError("Please fill in all fields.");
            return false;
        }
        setNotice(null);
        setError(null);
        try {
            const cred = await FirebaseService.auth.createUser(email, password);
            await FirebaseService.auth.updateProfile(cred.user, { displayName: username });
            setUser(cred.user);
            setUserId(cred.user.uid);
            setView("chat");
            return true;
        } catch (e) {
            setError(e.message);
            return false;
        }
    };

    const handleLogin = async (email, password) => {
        setNotice(null);
        if (!isFirebaseEnabled) {
            setError("Login is disabled because Firebase is not configured.");
            return false;
        }
        if (!email || !password) {
            setError("Please fill in all fields.");
            return false;
        }
        setError(null);
        try {
            const cred = await FirebaseService.auth.signIn(email, password);
            setUser(cred.user);
            setUserId(cred.user.uid);
            setView("chat");
            return true;
        } catch (e) {
            setError(e.message);
            return false;
        }
    };

    // Leave the session intact if remote sign-out fails; never report a local-only success.
    const handleLogout = async () => {
        try {
            if (isFirebaseEnabled) await FirebaseService.auth.signOut();
            setUser(null);
            setUserId(null);
            setError(null);
            setNotice(null);
            setView("welcome");
            return true;
        } catch (e) {
            setError(e.message);
            return false;
        }
    };

    const handleResetPassword = async (email) => {
        setError(null);
        setNotice(null);
        if (!email?.trim()) { setError("Enter your email address first."); return false; }
        try {
            await FirebaseService.auth.resetPassword(email.trim());
            setNotice("If an account exists for this email, you will receive password reset instructions.");
            return true;
        } catch (e) { setError(e.message); return false; }
    };

    return {
        user,
        userId,
        isAuthReady,
        error,
        notice,
        handleResetPassword,
        view,
        isGuest,
        goWelcome,
        goLogin,
        goRegister,
        goChat,
        goPreferences,
        goBilling,
        startGuest,
        handleRegister,
        handleLogin,
        handleLogout,
        setView
    };
};
