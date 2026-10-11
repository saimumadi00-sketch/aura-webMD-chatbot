/* Marketing uses the same quiet surfaces and controls as the app and doctor portal. */
import React, { useEffect } from 'react';
import { Brain, ArrowRight, ArrowUpRight, MessageCircle, SlidersHorizontal, Stethoscope, Shield } from 'lucide-react';
import '../styles/landing.css';
import ThemeToggle from './ThemeToggle';
import { Link } from 'react-router-dom';
import AnalyticsConsent from './AnalyticsConsent';
import '../styles/public-info.css';
import { DOCTORS_PORTAL_URL as portalUrl } from '../config/constants';

// Mirrors the chat starter prompts so the landing page previews what the app actually offers.
const starterTopics = ['Check in with myself', 'Feeling overwhelmed', 'Set a focus', 'Journal prompt'];

export default function LandingPage({ onStart, onLogin, theme, onToggleTheme }) {
  useEffect(() => {
    document.body.classList.add('landing-open');
    return () => document.body.classList.remove('landing-open');
  }, []);
  // Section links scroll within the current page.
  const scrollToSection = (event, id) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-nav">
          <Link className="nav-brand" to="/" aria-label="Aura home"><Brain size={22} /><span>Aura</span></Link>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#features" onClick={event => scrollToSection(event, 'features')}>Features</a>
            <a href="#science" onClick={event => scrollToSection(event, 'science')}>Privacy</a>
            <Link to="/doctors">Find a doctor</Link>
          </nav>
          <div className="landing-nav-actions"><ThemeToggle theme={theme} onToggleTheme={onToggleTheme} /><button className="nav-login" onClick={() => onLogin?.()}>Sign in</button></div>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-mesh" aria-hidden="true" />
          <div className="hero-copy">
            <p className="hero-badge"><span className="hero-badge-dot" aria-hidden="true" />Your space to reflect</p>
            <h1>A little clarity, one conversation at a time.</h1>
            <p className="hero-subtitle">Talk things through, find a small next step, or just take a breath. Aura is your AI companion, at your pace.</p>
            <div className="hero-actions">
              <button className="primary-btn" onClick={() => onStart?.()}>Start a conversation <ArrowRight size={18} /></button>
              <button className="secondary-btn" onClick={() => onLogin?.()}>Sign in</button>
            </div>
            <p className="hero-note">Try guest chat without an account.</p>
          </div>
          <div className="hero-showcase">
            <div className="conversation-preview" aria-label="Example conversation">
              <div className="preview-header"><span className="preview-mark"><Brain size={18} /></span><div><strong>Aura</strong><p>A space to talk things through</p></div><span className="preview-status">online</span></div>
              <div className="preview-messages"><p className="preview-user">Everything feels like a lot today.</p><div className="preview-answer"><span className="eyebrow">Aura</span><p>We can slow down for a moment. What's one thing that's been weighing on you?</p></div></div>
              <div className="preview-footer"><MessageCircle size={16} /><span>Start wherever you feel comfortable.</span></div>
            </div>
            <aside className="hero-topics" aria-labelledby="hero-topics-title">
              <p className="eyebrow" id="hero-topics-title">Try starting with</p>
              <ul>
                {starterTopics.map(topic => <li key={topic}><button type="button" onClick={() => onStart?.()}><span>{topic}</span><ArrowUpRight size={16} aria-hidden="true" /></button></li>)}
              </ul>
              <p className="hero-topics-note">No sign-up needed. Your guest chat stays on this device.</p>
            </aside>
          </div>
        </section>
        <section className="features" id="features">
          <div className="section-heading">
            <div><p className="eyebrow">Support that fits your day</p><h2>Space to pause. Tools to move forward.</h2></div>
            <p className="section-lead">Gentle reflection, practical next steps, or a route to human care. Aura adapts to how you want to talk.</p>
          </div>
          <div className="feature-grid">
            <article><span className="feature-icon"><MessageCircle size={20} /></span><h3>Talk it through</h3><p>Explore what's on your mind with supportive conversation and reflective prompts.</p></article>
            <article><span className="feature-icon"><SlidersHorizontal size={20} /></span><h3>Make it your own</h3><p>Choose your preferred tone, response style, and instructions in AI Preferences.</p></article>
            <article><span className="feature-icon"><Stethoscope size={20} /></span><h3>Find human support</h3><p>Connect with a qualified professional when you want support beyond chat.</p>{portalUrl ? <a href={portalUrl} target="_blank" rel="noopener noreferrer">Find a doctor <ArrowRight size={16} /></a> : <p>Doctor directory currently unavailable.</p>}</article>
          </div>
        </section>
      </main>
      <section className="about-band" id="science">
        <div className="about-section">
          <div className="about-heading"><Shield size={24} aria-hidden="true" /><p className="eyebrow">Privacy and care</p><h2>A companion, at your pace.</h2></div>
          <p className="about-body">Aura offers AI-generated support and does not replace professional care. Chat requests use our server API. Signed-in active conversations use Firebase; archives stay on your device.</p>
        </div>
      </section>
      <section className="cta" id="reviews"><div className="cta-card"><div><h2>Start with what's on your mind.</h2><p>You don't need the perfect words.</p></div><button className="primary-btn" onClick={() => onStart?.()}>Talk to Aura <ArrowRight size={18} /></button></div></section>
      <footer className="landing-footer"><div className="landing-footer-inner"><Link className="nav-brand" to="/"><Brain size={18} />Aura</Link><span className="footer-copy">© {new Date().getFullYear()} Aura</span><nav aria-label="Information"><Link to="/privacy">Privacy</Link><Link to="/terms">Usage</Link><Link to="/contact">Contact</Link></nav><AnalyticsConsent /><details className="urgent-support"><summary>Urgent support</summary><p>If you are in immediate danger, contact your local emergency services. Aura does not provide emergency support.</p></details></div></footer>
    </div>
  );
}
