import React, { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import NotFound from './NotFound';
import PublicInfo from './PublicInfo';
import { pageMetadata } from '../utils/page-metadata';

const SessionApp = lazy(() => import('./SessionApp'));
const Billing = lazy(() => import('./Billing'));
const DoctorPortal = lazy(() => import('./DoctorPortal'));

// Preserve old bookmarks, excluding protocol-relative URLs.
if (/^#\/(?!\/)/.test(window.location.hash)) window.history.replaceState(null, '', window.location.hash.slice(1));

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const needsSession = /^\/(chat|preferences|login|register|welcome)\/?$/.test(location.pathname);
  const [sessionStarted, setSessionStarted] = useState(needsSession);
  // Keep a started session mounted when visiting public pages, preserving guest chats.
  if (needsSession && !sessionStarted) setSessionStarted(true);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('aura-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); }
    catch { return 'dark'; }
  });
  useEffect(() => {
    if (sessionStarted) return;
    document.documentElement.classList.toggle('dark', theme !== 'light');
    document.body.classList.toggle('theme-dark', theme !== 'light');
    document.body.classList.toggle('theme-light', theme === 'light');
    try { localStorage.setItem('aura-theme', theme); } catch { /* Device storage can be unavailable. */ }
  }, [theme, sessionStarted]);
  useEffect(() => {
    const sync = event => { if (event.key === 'aura-theme' && ['light', 'dark'].includes(event.newValue)) setTheme(event.newValue); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useLayoutEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [location.pathname, location.search, location.key]);
  useEffect(() => {
    const metadata = pageMetadata(location.pathname);
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description);
    document.querySelector('meta[name="robots"]')?.setAttribute('content', metadata.index ? 'index,follow' : 'noindex,follow');
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', metadata.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', metadata.description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', window.location.origin + location.pathname);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(location.pathname, canonical.href).href;
  }, [location.pathname]);
  const controls = { theme, onToggleTheme: () => setTheme(previous => previous === 'light' ? 'dark' : 'light') };
  return <Suspense fallback={<main className="route-loading" role="status">Loading page...</main>}>
    {sessionStarted ? <SessionApp /> : <Routes>
      <Route path="/" element={<LandingPage {...controls} onStart={() => navigate('/welcome')} onLogin={() => navigate('/login')} />} />
      <Route path="/doctors" element={<DoctorPortal />} />
      <Route path="/billing" element={<Billing {...controls} onBack={() => navigate('/')} onSelectPlan={() => navigate('/welcome')} />} />
      {['privacy', 'terms', 'contact'].map(page => <Route key={page} path={`/${page}`} element={<PublicInfo page={page} {...controls} />} />)}
      <Route path="*" element={<NotFound {...controls} onHome={() => navigate('/')} />} />
    </Routes>}
  </Suspense>;
}
export default function AppWrapper() { return <BrowserRouter><App /></BrowserRouter>; }
