import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthChange } from "../services/auth";

/**
 * Wrap your Login page with <AuthGate> to auto-redirect signed-in users (incl. guests) to /chat.
 *
 * Usage:
 *   <AuthGate fallback={<LoginForm/>} redirectTo="/chat" />
 */
const AuthGate = ({ fallback = null, redirectTo = "/chat" }) => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (user) navigate(redirectTo);
  }, [ready, user, navigate, redirectTo]);

  if (!ready) return null; // or a spinner

  // If not signed in, render the caller-provided login UI
  return <>{fallback}</>;
};

export default AuthGate;
