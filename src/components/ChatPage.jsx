import React from 'react';
import Chat from './Chat';
import Preferences from './Preferences';
import Billing from './Billing';
import Loading from './Loading';

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
  conversations,
  conversationReady,
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
  goWelcome,
  goHome,
}) => {
  if (!isAuthReady && !isGuest) return <Loading />;

  if (view === 'preferences') {
    return (
      <Preferences
        preferences={preferences}
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
        user={user}
        isGuest={isGuest}
        onBack={isGuest ? goWelcome : goPreferences}
        onSelectPlan={handlePlanSelect}
      />
    );
  }

  return (
    <Chat
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
    />
  );
};

export default ChatPage;
