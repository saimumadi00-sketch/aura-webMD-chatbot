import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseEnabled } from "../services/firebase";
import { useEffect, useState } from "react";
import FirebaseService from "../services/firebase";

export const useAuth = () => {
    const [user, setUser] = useState(null); // { uid, displayName, email, isGuest? }
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState("welcome");

    const isGuest = !!user?.isGuest;

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
        setUser({ uid: "guest", displayName: "Guest", isGuest: true });
        setUserId("guest");
        setView("chat");
    };

    const handleRegister = async (email, password, username) => {
        if (!isFirebaseEnabled) {
            setError("Account creation is disabled because Firebase is not configured.");
            return;
        }
        if (!email || !password || !username) {
            setError("Please fill in all fields.");
            return;
        }
        setError(null);
        try {
            const cred = await FirebaseService.auth.createUser(email, password);
            await FirebaseService.auth.updateProfile(cred.user, { displayName: username });
            setUser(cred.user);
            setUserId(cred.user.uid);
            setView("chat");
        } catch (e) {
            setError(e.message);
        }
    };

    const handleLogin = async (email, password) => {
        if (!isFirebaseEnabled) {
            setError("Login is disabled because Firebase is not configured.");
            return;
        }
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setError(null);
        try {
            await FirebaseService.auth.signIn(email, password);
            // onAuthStateChanged will route to chat
        } catch (e) {
            setError(e.message);
        }
    };

    const handleLogout = async () => {
        const conversationKey = userId ? `aura-conversations-${userId}` : "aura-conversations-guest";
        try {
            if (!isGuest && isFirebaseEnabled) await FirebaseService.auth.signOut();
        } catch (e) {
            setError(e.message);
        } finally {
            setUser(null);
            setUserId(null);
            try {
                localStorage.removeItem(conversationKey);
            } catch {
                /* noop */
            }
            setView("welcome");
        }
    };

    return {
        user,
        userId,
        isAuthReady,
        error,
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
