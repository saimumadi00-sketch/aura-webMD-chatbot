/* Marketing uses the same quiet surfaces and controls as the app and doctor portal. */
import React, { useEffect } from 'react';
import { Brain, ArrowRight, MessageCircle, SlidersHorizontal, Stethoscope, Shield } from 'lucide-react';
import '../styles/landing.css';
import ThemeToggle from './ThemeToggle';
import { DOCTORS_PORTAL_URL as portalUrl } from '../config/constants';

export default function LandingPage({ onStart, onLogin, theme, onToggleTheme }) {
  useEffect(() => {
    document.body.classList.add('landing-open');
    return () => document.body.classList.remove('landing-open');
  }, []);
  // HashRouter owns the fragment; section links scroll without changing the route.
  const scrollToSection = (event, id) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <div className="landing">
      <header className="landing-nav">
        <a className="nav-brand" href="#/" aria-label="Aura home"><Brain size={25} /><span>Aura</span></a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#features" onClick={event => scrollToSection(event, 'features')}>Features</a>
          <a href="#/doctors">Find a doctor</a>
        </nav>
        <div className="landing-nav-actions"><ThemeToggle theme={theme} onToggleTheme={onToggleTheme} /><button className="nav-login" onClick={() => onLogin?.()}>Sign in</button></div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">YOUR SPACE TO REFLECT</p>
            <h1>A little clarity.<br /><span>One conversation<br />at a time.</span></h1>
            <p className="hero-subtitle">Talk things through, find a small next step, or just take a breath. Aura is your AI companion, at your pace.</p>
            <button className="primary-btn" onClick={() => onStart?.()}>Start a conversation <ArrowRight size={18} /></button>
            <p className="hero-note">Try guest chat without an account.</p>
          </div>
          <div className="conversation-preview" aria-label="Example conversation">
            <div className="preview-header"><span className="preview-mark"><Brain size={22} /></span><div><strong>Aura</strong><p>A space to talk things through</p></div></div>
            <div className="preview-messages"><p className="preview-user">Everything feels like a lot today.</p><div className="preview-answer"><span className="eyebrow">AURA</span><p>We can slow down for a moment. What's one thing that's been weighing on you?</p></div></div>
            <div className="preview-footer"><MessageCircle size={16} /><span>Start wherever you feel comfortable.</span></div>
          </div>
        </section>
        <section className="features" id="features">
          <div className="section-heading"><p className="eyebrow">SUPPORT THAT FITS YOUR DAY</p><h2>Space to pause. Tools to move forward.</h2></div>
          <div className="feature-grid">
            <article><MessageCircle size={24} /><h3>Talk it through</h3><p>Explore what's on your mind with supportive conversation and reflective prompts.</p></article>
            <article><SlidersHorizontal size={24} /><h3>Make it your own</h3><p>Choose your preferred tone, response style, and instructions in AI Preferences.</p></article>
            <article><Stethoscope size={24} /><h3>Find human support</h3><p>Connect with a qualified professional when you want support beyond chat.</p>{portalUrl ? <a href={portalUrl} target="_blank" rel="noopener noreferrer">Find a doctor <ArrowRight size={16} /></a> : <p>Doctor directory currently unavailable.</p>}</article>
          </div>
        </section>
        <section className="about-section" id="science"><Shield size={26} /><div><h2>A companion, at your pace.</h2><p>Aura offers AI-generated support and does not replace professional care. Chat requests use our server API. Signed-in active conversations use Firebase; archives stay on your device.</p></div></section>
        <section className="cta" id="reviews"><div><h2>Start with what's on your mind.</h2><p>You don't need the perfect words.</p></div><button className="primary-btn" onClick={() => onStart?.()}>Talk to Aura <ArrowRight size={18} /></button></section>
      </main>
      <footer className="landing-footer"><a className="nav-brand" href="#/"><Brain size={22} />Aura</a><span>© {new Date().getFullYear()} Aura</span><details className="urgent-support"><summary>Urgent support</summary><p>If you are in immediate danger, contact your local emergency services. Aura does not provide emergency support.</p></details></footer>
    </div>
  );
}
