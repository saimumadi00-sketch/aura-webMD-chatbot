import React, { useState } from "react";
import { ArrowLeft, Moon, Sun, Facebook, Linkedin, Mail } from "lucide-react";
import "../styles/welcome.css";

export default function Welcome({ onGuest, onLogin, onRegister, theme = "dark", onToggleTheme, onHome, error }) {
  const [isRightPanel, setIsRightPanel] = useState(false);
  const isDark = theme !== "light";
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ name: "", email: "", password: "" });

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    onLogin?.(signIn.email, signIn.password);
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    onRegister?.(signUp.email, signUp.password, signUp.name);
  };

  const handleGuest = () => onGuest?.();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handleGoRegister = () => setIsRightPanel(true);

  return (
    <div className={`welcome-page ${isDark ? "dark-mode" : ""}`}>
      <div className="welcome-bg-layer">
        <div className="welcome-grid" />
        <div className="welcome-orb orb-1" />
        <div className="welcome-orb orb-2" />
        <div className="welcome-orb orb-3" />
      </div>

      <button
        id="backBtn"
        className="nav-btn"
        title="Go Back"
        onClick={onHome ? onHome : handleBack}
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
        New here? Create an account
      </button>

      <div
        className={`welcome-container ${isRightPanel ? "right-panel-active" : ""}`}
        id="container"
      >
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUpSubmit}>
            <h1>Create Account</h1>
            <div className="social-container">
              <a aria-label="Sign up with Facebook" href="#">
                <Facebook size={18} />
              </a>
              <a aria-label="Sign up with Mail" href="#">
                <Mail size={18} />
              </a>
              <a aria-label="Sign up with LinkedIn" href="#">
                <Linkedin size={18} />
              </a>
            </div>
            <span>or use your email for registration</span>
            <input
              type="text"
              placeholder="Name"
              value={signUp.name}
              onChange={(e) => setSignUp({ ...signUp, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={signUp.email}
              onChange={(e) => setSignUp({ ...signUp, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={signUp.password}
              onChange={(e) => setSignUp({ ...signUp, password: e.target.value })}
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit">Sign Up</button>
          </form>
        </div>

        <div className="form-container sign-in-container">
          <form onSubmit={handleSignInSubmit}>
            <h1>Sign in</h1>
            <div className="social-container">
              <a aria-label="Sign in with Facebook" href="#">
                <Facebook size={18} />
              </a>
              <a aria-label="Sign in with Mail" href="#">
                <Mail size={18} />
              </a>
              <a aria-label="Sign in with LinkedIn" href="#">
                <Linkedin size={18} />
              </a>
            </div>
            <span>or use your account</span>
            <input
              type="email"
              placeholder="Email"
              value={signIn.email}
              onChange={(e) => setSignIn({ ...signIn, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={signIn.password}
              onChange={(e) => setSignIn({ ...signIn, password: e.target.value })}
            />
            <a href="#">Forgot your password?</a>
            {error && <p className="form-error">{error}</p>}
            <button type="submit">Sign In</button>
            <button type="button" className="guest-btn" onClick={handleGuest}>
              Guest Log In
            </button>
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button
                className="ghost"
                id="signIn"
                type="button"
                onClick={() => setIsRightPanel(false)}
              >
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button
                className="ghost"
                id="signUp"
                type="button"
                onClick={() => setIsRightPanel(true)}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

