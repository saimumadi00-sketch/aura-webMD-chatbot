import React from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAura } from '../hooks/useAura';

import LandingPage from './LandingPage';
import ChatPage from './ChatPage';
import AuthForm from './AuthForm';
import Welcome from './Welcome';
import Billing from './Billing';

const App = () => {
  const aura = useAura();
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    await aura.handleLogin(email, password);
    navigate('/chat');
  };

  const handleRegister = async (email, password, username) => {
    await aura.handleRegister(email, password, username);
    navigate('/chat');
  };

  const handleGuest = () => {
    aura.startGuest();
    navigate('/chat');
  };

  const goHome = () => navigate('/');

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage onStart={() => navigate('/welcome')} onLogin={() => navigate('/login')} />}
      />
      <Route
        path="/chat"
        element={
          <ChatPage
            {...aura}
            goWelcome={() => navigate('/')}
            goChat={aura.goChat}
            goPreferences={aura.goPreferences}
            goBilling={() => navigate('/billing')}
            goHome={goHome}
          />
        }
      />
      <Route
        path="/login"
        element={
          <AuthForm
            mode="login"
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => navigate('/')}
            error={aura.error}
          />
        }
      />
      <Route
        path="/register"
        element={
          <AuthForm
            mode="register"
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => navigate('/login')}
            error={aura.error}
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
              theme={aura.theme}
              onToggleTheme={aura.handleToggleTheme}
              onHome={goHome}
            />
        }
      />
      <Route path="/billing" element={<Billing />} />
    </Routes>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
