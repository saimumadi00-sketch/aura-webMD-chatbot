import React, { useState, useEffect } from "react";
import "../styles/welcome.css";

export default function AuthForm({
  mode = "login",
  onRegister,
  onLogin,
  onBack,
  error,
}) {
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isRegister && email.includes("@")) {
      const suggestedName = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      if (!username) setUsername(suggestedName);
    }
  }, [email, isRegister, username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (isRegister) await onRegister(email, password, username);
    else await onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="auth-experience">
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="auth-info">
          <div className="auth-top-row">
            <button type="button" onClick={onBack} className="auth-logo">
              AI
            </button>
            <p>
              New here?{" "}
              <span className="auth-link" onClick={() => onBack()}>
                Log in or continue as guest
              </span>
            </p>
          </div>

          <h1>{isRegister ? "Sign up" : "Welcome back"}</h1>
          <p className="auth-subtext">Sign in with Aura or continue with email</p>

          <div className="auth-social">
            <button type="button" title="Google sign-in">
              <span aria-hidden="true">G</span>
              Google
            </button>
            <button type="button" title="Apple sign-in">
              <span aria-hidden="true">A</span>
              Apple ID
            </button>
          </div>

          <div className="auth-divider">Or continue with email</div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email
              <input
                type="email"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </label>

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
          <div className="bot">
            <div className="bot-head">
              <div className="bot-eye left" />
              <div className="bot-eye right" />
            </div>
            <div className="bot-body">
              <div className="bot-panel" />
              <div className="bot-arm left" />
              <div className="bot-arm right">
                <div className="bot-hand" />
              </div>
            </div>
          </div>
          <div className="auth-cta">Aura is ready to help!</div>
        </div>
      </div>
    </div>
  );
}