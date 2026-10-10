/*
 * Page routing: URL routes select landing/auth/chat/preferences/billing pages; useAura supplies session actions.
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAura } from '../hooks/useAura';

import LandingPage from './LandingPage';
import ChatPage from './ChatPage';
import AuthForm from './AuthForm';
import Welcome from './Welcome';
import Billing from './Billing';
import DoctorPortal from './DoctorPortal';

const App = () => {
  // URL routes choose pages; useAura supplies session state and actions.
  const aura = useAura();
  const navigate = useNavigate();
  const themeControls = { theme: aura.theme, onToggleTheme: aura.handleToggleTheme };

  // Router-created entries stay inside the app. Direct links have no prior app page.
  const goBack = (fallback = '/') => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
  const goChat = () => { aura.goChat(); navigate('/chat'); };
  const sessionPage = view => (
    <ChatPage
      {...aura}
      view={view}
      handleLogout={handleLogout}
      goLogin={() => navigate('/login')}
      goChat={() => { aura.goChat(); goBack('/chat'); }}
      goPreferences={() => navigate('/preferences')}
      goBilling={() => navigate('/billing')}
      goHome={goHome}
    />
  );

  const handleLogin = async (email, password) => {
    if (await aura.handleLogin(email, password)) navigate('/chat');
  };

  const handleRegister = async (email, password, username) => {
    if (await aura.handleRegister(email, password, username)) navigate('/chat');
  };

  const handleGuest = () => {
    aura.startGuest();
    navigate('/chat');
  };

  const goHome = () => navigate('/');
  const handleLogout = async () => {
    const success = await aura.handleLogout();
    if (success) navigate('/welcome');
    return success;
  };
  const handlePlanSelect = () => { if (!aura.user) aura.startGuest(); goChat(); };

  return (
    <Routes>
      <Route path="/doctors" element={<DoctorPortal />} />
      <Route
        path="/"
        element={<LandingPage {...themeControls} onStart={() => navigate('/welcome')} onLogin={() => navigate('/login')} />}
      />
      <Route
        path="/chat"
        element={sessionPage('chat')}
      />
      <Route path="/preferences" element={sessionPage('preferences')} />
      <Route
        path="/login"
        element={
          <AuthForm {...themeControls}
            mode="login"
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => goBack('/')}
            error={aura.error}
            notice={aura.notice}
            onResetPassword={aura.handleResetPassword}
          />
        }
      />
      <Route
        path="/register"
        element={
          <AuthForm {...themeControls}
            mode="register"
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => goBack('/')}
            error={aura.error}
            notice={aura.notice}
            onResetPassword={aura.handleResetPassword}
          />
        }
      />
       <Route
       path="/welcome"
       element={
            <Welcome
              onGuest={handleGuest}
              onLogin={handleLogin}
              onRegister={handleRegister}
              error={aura.error}
              notice={aura.notice}
              onResetPassword={aura.handleResetPassword}
              theme={aura.theme}
              onToggleTheme={aura.handleToggleTheme}
              onHome={goHome}
              onBack={() => goBack('/')}
            />
        }
      />
      <Route path="*" element={<LandingPage {...themeControls} onStart={() => navigate('/welcome')} onLogin={() => navigate('/login')} />} />
      <Route path="/billing" element={<Billing {...themeControls} user={aura.user} isGuest={aura.isGuest} onBack={() => goBack(aura.user ? '/chat' : '/')} onSelectPlan={handlePlanSelect} />} />
    </Routes>
  );
};

const AppWrapper = () => (
  // Hash routes avoid requiring a server rewrite for frontend navigation.
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
