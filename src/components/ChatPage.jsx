/*
 * Session page adapter: choose preferences/billing/chat from internal view state and forward hook actions as props.
 */

import React from 'react';
import Chat from './Chat';
import Preferences from './Preferences';
import Billing from './Billing';
import Loading from './Loading';
import { Navigate } from 'react-router-dom';

const ChatPage = ({
  user,
  isGuest,
  isAuthReady,
  view,
  messages,
  preferences,
  currentMessage,
  setCurrentMessage,
  isBotLoading,
  canStopReply,
  handleStopReply,
  conversations,
  conversationReady,
  activeArchiveId,
  handleLogout,
  handleSavePreferences,
  handleClearHistory,
  handleSummarizeChat,
  handleStartNewConversation,
  handleOpenConversation,
  handleRenameConversation,
  handleDeleteConversation,
  handlePlanSelect,
  handleToggleTheme,
  theme,
  handleSendMessage,
  goChat,
  goPreferences,
  goBilling,
  goHome,
  goLogin,
  chatError,
  preferencesError,
}) => {
  if (!isAuthReady && !isGuest) return <Loading />;

  if (!user) return <Navigate to="/welcome" replace />;

  // Internal view state selects subpages without introducing additional URL routes.
  if (view === 'preferences') {
    return (
      <Preferences
        preferences={preferences}
        onLogin={goLogin}
        error={preferencesError}
        onSavePreferences={handleSavePreferences}
        onClearHistory={handleClearHistory}
        onSummarizeChat={handleSummarizeChat}
        onLogout={handleLogout}
        onBack={goChat}
        messages={messages}
        isBotLoading={isBotLoading}
        user={user}
        conversations={conversations}
        onOpenConversation={handleOpenConversation}
        onManageBilling={goBilling}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onHome={goHome}
      />
    );
  }

  if (view === 'billing') {
    return (
      <Billing
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={user}
        isGuest={isGuest}
        onBack={goChat}
        onSelectPlan={handlePlanSelect}
      />
    );
  }

  return (
    <Chat
      threadKey={activeArchiveId || 'active'}
      theme={theme}
      onToggleTheme={handleToggleTheme}
      onHome={goHome}
      error={chatError || preferencesError}
      messages={messages}
      currentMessage={currentMessage}
      setCurrentMessage={setCurrentMessage}
      onSendMessage={handleSendMessage}
      onOpenPreferences={goPreferences}
      onSummarizeChat={handleSummarizeChat}
      onNewConversation={handleStartNewConversation}
      conversations={conversations}
      onOpenConversation={handleOpenConversation}
      onRenameConversation={handleRenameConversation}
      onDeleteConversation={handleDeleteConversation}
      onManageBilling={goBilling}
      conversationReady={conversationReady}
      user={user}
      isBotLoading={isBotLoading}
      canStopReply={canStopReply}
      onStopReply={handleStopReply}
    />
  );
};

export default ChatPage;
