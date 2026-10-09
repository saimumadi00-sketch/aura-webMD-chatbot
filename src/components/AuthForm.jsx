/*
 * Controlled email/password form. Field state stays here; the parent owns Firebase authentication and errors.
 */

import React, { useState, useEffect } from "react";
import "../styles/welcome.css";
import "../styles/auth.css";
import { useNavigate } from "react-router-dom";
import ThemeToggle from './ThemeToggle';

export default function AuthForm({
  mode = "login",
  onRegister,
  onLogin,
  onBack,
  error,
  notice,
  onResetPassword,
  theme,
  onToggleTheme,
}) {
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Suggest a username from the email only while the username draft is empty.
  useEffect(() => {
    if (isRegister && email.includes("@")) {
      const suggestedName = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      if (!username) setUsername(suggestedName);
    }
  }, [email, isRegister, username]);

  // Prevent a page reload and keep the submit button busy until the parent action settles.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isRegister) await onRegister(email, password, username);
      else await onLogin(email, password);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="auth-experience">
      <div className="auth-theme-control"><ThemeToggle theme={theme} onToggleTheme={onToggleTheme} /></div>
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="auth-info">
          <div className="auth-top-row">
            <button type="button" onClick={onBack} className="auth-logo">
              Aura
            </button>
            <p>
              {isRegister ? 'Already have an account?' : 'New here?'}{" "}
              <button type="button" className="auth-link" onClick={() => navigate(isRegister ? "/login" : "/register")}>
                {isRegister ? "Log in" : "Create an account"}
              </button>
            </p>
          </div>

          <h1>{isRegister ? "Sign up" : "Welcome back"}</h1>
          <p className="auth-subtext">{isRegister ? 'Create an account to save your conversations and preferences.' : 'A quiet space to pick up where you left off.'}</p>
          <div className="auth-divider">Continue with email</div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            {isRegister && (
              <label>
                Username
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="janesmith"
                  required
                />
              </label>
            )}

            <label>
              Password
              <input
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </label>

            {!isRegister && <button className="auth-link auth-reset" type="button" disabled={isLoading} onClick={async () => { setIsLoading(true); try { await onResetPassword(email); } finally { setIsLoading(false); } }}>Forgot password?</button>}
            {notice && <p role="status">{notice}</p>}
            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={isLoading} className="auth-primary">
              {isLoading
                ? isRegister
                  ? "Registering..."
                  : "Signing in..."
                : isRegister
                ? "Continue"
                : "Sign in"}
            </button>
          </form>
        </div>

        <div className="auth-illustration">
          <span className="auth-orbit" aria-hidden="true">✦</span>
          <h2>A little room<br />to breathe.</h2>
          <p>Reflect, find a small next step, or simply talk things through.</p>
          <div className="auth-preview">“We can take this one conversation at a time.”</div>
          <p className="auth-cta">Your AI companion, at your pace.</p>
        </div>
      </div>
    </div>
  );
}
