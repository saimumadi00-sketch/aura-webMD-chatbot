import React from 'react';
import ThemeToggle from './ThemeToggle';
import '../styles/auth.css';

export default function NotFound({ theme, onToggleTheme, onHome }) {
  return <main className="auth-experience">
    <div className="auth-theme-control"><ThemeToggle theme={theme} onToggleTheme={onToggleTheme} /></div>
    <section className="auth-info" aria-labelledby="not-found-title">
      <p className="auth-subtext">404 · Page not found</p>
      <h1 id="not-found-title">This page isn’t here.</h1>
      <p className="auth-subtext">The address may be incorrect, or the page may have moved.</p>
      <button type="button" className="auth-primary" onClick={onHome}>Return to Aura</button>
    </section>
  </main>;
}
