/*
 * Combined sign-in/sign-up screen. Form drafts are local; account and guest actions come from the parent.
 */

import React, { useState } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import "../styles/welcome.css";

export default function Welcome({ onGuest, onLogin, onRegister, theme = "dark", onToggleTheme, onHome, onBack, error, notice, onResetPassword }) {
  // The selected form changes without losing either draft or navigating away.
  const [isRightPanel, setIsRightPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDark = theme !== "light";
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ name: "", email: "", password: "" });

  // Form submission forwards credentials to the parent and avoids native page navigation.
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try { await onLogin?.(signIn.email, signIn.password); } finally { setIsLoading(false); }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try { await onRegister?.(signUp.email, signUp.password, signUp.name); } finally { setIsLoading(false); }
  };

  const handleGuest = () => onGuest?.();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handleGoRegister = () => setIsRightPanel(value => !value);

  return (
    <div className={`welcome-page ${isDark ? "dark-mode" : ""}`}>
      <button
        id="backBtn"
        className="nav-btn"
        title="Go Back"
        onClick={onBack || onHome || handleBack}
        type="button"
        aria-label="Go back"
      >
        <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
        <span className="nav-label">Back</span>
      </button>

      <button
        id="themeToggle"
        className="nav-btn show-label"
        title="Toggle Theme"
        onClick={() => onToggleTheme?.()}
        type="button"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} strokeWidth={2.4} /> : <Moon size={18} strokeWidth={2.4} />}
        <span className="nav-label nav-label--persistent">
          {isDark ? "Light" : "Dark"}
        </span>
      </button>

      <button
        type="button"
        className="register-cta"
        onClick={handleGoRegister}
      >
        {isRightPanel ? 'Already a member? Sign in' : 'New here? Create an account'}
      </button>

      <div
        className={`welcome-container ${isRightPanel ? "right-panel-active" : ""}`}
        id="container"
      >
        <div className="form-container sign-up-container" inert={!isRightPanel}>
          <form onSubmit={handleSignUpSubmit}>
            <h1>Create Account</h1>
            <span>Sign up with your email</span>
            <input
              type="text" required autoComplete="name" aria-label="Name"
              placeholder="Name"
              value={signUp.name}
              onChange={(e) => setSignUp({ ...signUp, name: e.target.value })}
            />
            <input
              type="email" required autoComplete="email" aria-label="Email"
              placeholder="Email"
              value={signUp.email}
              onChange={(e) => setSignUp({ ...signUp, email: e.target.value })}
            />
            <input
              type="password" required minLength={6} autoComplete="new-password" aria-label="Password"
              placeholder="Password"
              value={signUp.password}
              onChange={(e) => setSignUp({ ...signUp, password: e.target.value })}
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" disabled={isLoading}>Sign Up</button>
          </form>
        </div>

        <div className="form-container sign-in-container" inert={isRightPanel}>
          <form onSubmit={handleSignInSubmit}>
            <h1>Sign in</h1>
            <span>Continue with your email</span>
            <input
              type="email" required autoComplete="email" aria-label="Email"
              placeholder="Email"
              value={signIn.email}
              onChange={(e) => setSignIn({ ...signIn, email: e.target.value })}
            />
            <input
              type="password" required autoComplete="current-password" aria-label="Password"
              placeholder="Password"
              value={signIn.password}
              onChange={(e) => setSignIn({ ...signIn, password: e.target.value })}
            />
            <button className="welcome-reset" type="button" disabled={isLoading} onClick={async () => { setIsLoading(true); try { await onResetPassword(signIn.email); } finally { setIsLoading(false); } }}>Forgot your password?</button>
            {notice && <p role="status">{notice}</p>}
            {error && <p className="form-error">{error}</p>}
            <button type="submit" disabled={isLoading}>Sign In</button>
            <button type="button" disabled={isLoading} className="guest-btn" onClick={handleGuest}>
              Continue as guest
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
