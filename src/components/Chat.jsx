import React, { useState } from "react";
import { useAutoScroll } from "../utils/helpers";
import Sidebar from "./Sidebar";
import ChatActive from "./ChatActive";
import Workspace from "./Workspace";
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
  onHome,
}) => {
  const [showSummaryPrompt, setShowSummaryPrompt] = useState(false);
  const modalStyles = {
    backdrop: {
      position: "fixed",
      inset: 0,
      background: "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12), transparent 35%), rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      backdropFilter: "blur(8px)",
      animation: "fadeIn 200ms ease-out",
    },
    card: {
      background: "linear-gradient(135deg, #0f172a 0%, #101827 50%, #0b1326 100%)",
      color: "#e2e8f0",
      borderRadius: "18px",
      padding: "22px",
      width: "340px",
      boxShadow: "0 25px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      transform: "translateY(6px)",
      animation: "modalPop 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "18px",
    },
  };
  const messagesEndRef = useAutoScroll([messages]);
  const hasConversation = conversationReady || messages.length > 0;

  const handleSend = (overrideText) => {
    const candidate = typeof overrideText === "string" ? overrideText : currentMessage;
    const text = candidate?.trim();
    if (!text || isBotLoading) return;
    onSendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarterPrompt = (promptText) => {
    const text = promptText?.trim();
    if (!text || isBotLoading) return;
    setCurrentMessage(text);
    handleSend(text);
  };

  return (
    <div className="app">
      <Sidebar
        user={user}
        conversations={conversations}
        onNewConversation={onNewConversation}
        onOpenConversation={onOpenConversation}
        onRenameConversation={onRenameConversation}
        onDeleteConversation={onDeleteConversation}
        onOpenPreferences={onOpenPreferences}
        onManageBilling={onManageBilling}
        onHome={onHome}
      />

      <main className={`main ${hasConversation ? "main-active" : ""}`}>
        <div className="top-bar">
          <div className="pill">Free plan</div>
          <button
            type="button"
            className="pill pill-upgrade"
            onClick={() => setShowSummaryPrompt(true)}
            disabled={isBotLoading}
          >
            Summary
          </button>
        </div>

        {hasConversation ? (
          <ChatActive
            messages={messages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSendMessage={handleSend}
            isBotLoading={isBotLoading}
            user={user}
          />
        ) : (
          <Workspace
            handleStarterPrompt={handleStarterPrompt}
            isBotLoading={isBotLoading}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            handleKeyDown={handleKeyDown}
            handleSend={handleSend}
            messagesEndRef={messagesEndRef}
          />
        )}
      </main>

      {showSummaryPrompt && (
        <div style={modalStyles.backdrop}>
          <div style={modalStyles.card}>
            <p className="modal-title" style={{ fontWeight: 800, marginBottom: 10, letterSpacing: "0.01em" }}>
              Export a gentle summary?
            </p>
            <p className="modal-body" style={{ marginBottom: 14, lineHeight: 1.5, color: "#cbd5e1" }}>
              We will condense this chat into a warm, concise brief you can share with a clinician or keep for your own reflection.
            </p>
            <div className="modal-actions" style={modalStyles.actions}>
              <button
                type="button"
                className="pill"
                onClick={() => setShowSummaryPrompt(false)}
                disabled={isBotLoading}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
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
                style={{ boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}
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





