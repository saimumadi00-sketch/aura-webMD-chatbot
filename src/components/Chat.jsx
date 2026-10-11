/*
 * Chat shell: coordinate sidebar actions, empty/active composers, and the PDF-summary confirmation dialog.
 */

import React, { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import ChatActive from "./ChatActive";
import Workspace from "./Workspace";
import ThemeToggle from './ThemeToggle';
import "../styles/animations.css";

const Chat = ({
  messages = [],
  currentMessage = "",
  setCurrentMessage = () => {},
  onSendMessage = () => {},
  onOpenPreferences = () => {},
  onSummarizeChat = () => {},
  onNewConversation = () => {},
  conversations = [],
  onOpenConversation = () => {},
  onRenameConversation = () => {},
  onDeleteConversation = () => {},
  onManageBilling = () => {},
  conversationReady = false,
  user,
  isBotLoading = false,
  canStopReply = false,
  onStopReply,
  onHome,
  error,
  theme,
  onToggleTheme,
  threadKey,
}) => {
  const [showSummaryPrompt, setShowSummaryPrompt] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const summaryButtonRef = useRef(null);
  const cancelSummaryRef = useRef(null);
  const closeSidebar = () => { setIsSidebarOpen(false); menuButtonRef.current?.focus(); };
  useEffect(() => {
    if (!isSidebarOpen) return;
    const mobile = window.matchMedia('(max-width: 900px)');
    const handleResize = () => { if (!mobile.matches) setIsSidebarOpen(false); };
    mobile.addEventListener('change', handleResize);
    return () => mobile.removeEventListener('change', handleResize);
  }, [isSidebarOpen]);
  useEffect(() => {
    if (!isSidebarOpen && !showSummaryPrompt) return;
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      if (showSummaryPrompt) { setShowSummaryPrompt(false); summaryButtonRef.current?.focus(); }
      else closeSidebar();
    };
    document.addEventListener('keydown', handleEscape);
    if (showSummaryPrompt) cancelSummaryRef.current?.focus();
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen, showSummaryPrompt]);
  const modalStyles = {
    backdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      backdropFilter: "blur(4px)",
      animation: "fadeIn 200ms ease-out",
    },
    card: {
      background: "var(--bg-panel)",
      color: "var(--text-main)",
      borderRadius: "12px",
      padding: "32px",
      width: "min(400px, calc(100vw - 32px))",
      boxShadow: "var(--aura-shadow-modal)",
      border: 0,
      transform: "translateY(6px)",
      animation: "modalPop 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "24px",
    },
  };
  // A restored archive or any new message switches from starter prompts to the active thread.
  const hasConversation = conversationReady || messages.length > 0;

  // Starter cards pass explicit text; composer events use the controlled draft instead.
  const handleSend = (overrideText) => {
    const candidate = typeof overrideText === "string" ? overrideText : currentMessage;
    const text = candidate?.trim();
    if (!text || isBotLoading) return;
    onSendMessage(text);
  };

  const handleStarterPrompt = (promptText) => {
    const text = promptText?.trim();
    if (!text || isBotLoading) return;
    setCurrentMessage(text);
    handleSend(text);
  };

  return (
    <div className={`app ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {isSidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={closeSidebar} />}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        user={user}
        conversations={conversations}
        onNewConversation={() => { closeSidebar(); onNewConversation(); }}
        onOpenConversation={(id) => { closeSidebar(); onOpenConversation(id); }}
        onRenameConversation={onRenameConversation}
        onDeleteConversation={onDeleteConversation}
        onOpenPreferences={() => { closeSidebar(); onOpenPreferences(); }}
        onManageBilling={() => { closeSidebar(); onManageBilling(); }}
        onHome={onHome}
      />

      <main inert={isSidebarOpen && window.matchMedia('(max-width: 900px)').matches} className={`main ${hasConversation ? "main-active" : ""}`}>
        <div className="top-bar">
          <button ref={menuButtonRef} type="button" className="mobile-menu-button pill" aria-label="Open navigation" aria-expanded={isSidebarOpen} aria-controls="chat-sidebar" onClick={() => setIsSidebarOpen(true)}>☰ <span>Menu</span></button>
          <div className="chat-context"><strong>Aura</strong><span>Your space to reflect</span></div>
          <div className="pill">Free plan</div>
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          <button
            type="button"
            className="pill pill-upgrade"
            ref={summaryButtonRef}
            onClick={() => setShowSummaryPrompt(true)}
            disabled={isBotLoading || !messages.length}
          >
            Summary
          </button>
        </div>
        {error && <p role="alert" className="chat-error">{error}</p>}

          <ChatActive
            threadKey={threadKey}
            key={user?.uid || user?.id || 'guest'}
            messages={messages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSendMessage={handleSend}
            isBotLoading={isBotLoading}
            canStopReply={canStopReply}
            onStopReply={onStopReply}
            user={user}
            emptyState={!hasConversation ? <Workspace handleStarterPrompt={handleStarterPrompt} isBotLoading={isBotLoading} /> : null}
          />
      </main>

      {showSummaryPrompt && (
        <div style={modalStyles.backdrop} onClick={() => { setShowSummaryPrompt(false); summaryButtonRef.current?.focus(); }}>
          <div style={modalStyles.card} role="dialog" aria-modal="true" aria-labelledby="summary-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
            if (event.key !== 'Tab') return;
            const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')];
            const target = event.shiftKey ? buttons.at(-1) : buttons[0];
            if (document.activeElement === (event.shiftKey ? buttons[0] : buttons.at(-1))) { event.preventDefault(); target?.focus(); }
          }}>
            <p id="summary-title" className="modal-title" style={{ fontSize: 20, lineHeight: "28px", fontWeight: 600, marginBottom: 8, letterSpacing: "-0.6px" }}>
              Export a gentle summary?
            </p>
            <p className="modal-body" style={{ marginBottom: 8, fontSize: 14, lineHeight: "20px", color: "var(--text-muted)" }}>
              Download an AI summary and a copy of this conversation as a PDF. The export can include your messages and images.
            </p>
            <div className="modal-actions" style={modalStyles.actions}>
              <button
                type="button"
                className="pill"
                ref={cancelSummaryRef}
                onClick={() => { setShowSummaryPrompt(false); summaryButtonRef.current?.focus(); }}
                disabled={isBotLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pill pill-upgrade"
                onClick={() => {
                  setShowSummaryPrompt(false);
                  onSummarizeChat();
                }}
                disabled={isBotLoading}
              >
                Create Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;





