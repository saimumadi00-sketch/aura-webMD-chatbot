import React from 'react';
import DecryptedText from './DecryptedText';
import LoadingIndicator from './LoadingIndicator';

const Workspace = ({
  handleStarterPrompt,
  isBotLoading,
  currentMessage,
  setCurrentMessage,
  handleKeyDown,
  handleSend,
  messagesEndRef,
}) => {
  const starterPrompts = [
    {
      id: 'checkin',
      title: 'Check in with myself',
      description: "Share how you're doing and get a gentle reflection.",
      text: 'Can you help me check in with myself?',
    },
    {
      id: 'overwhelmed',
      title: 'Feeling overwhelmed',
      description: 'Ask for grounding steps when everything feels heavy.',
      text: "I'm feeling overwhelmed and could use a grounding exercise.",
    },
    {
      id: 'focus',
      title: 'Set a focus',
      description: 'Choose one small, meaningful goal for today.',
      text: 'Help me pick one small, meaningful focus for today.',
    },
    {
      id: 'journal',
      title: 'Journal prompt',
      description: 'Ask Aura for a thoughtful prompt to start writing.',
      text: 'Give me a thoughtful journal prompt to start writing.',
    },
  ];

  return (
    <section className="workspace">
      <div className="workspace-shell">
        <div className="workspace-hero">
          <div className="golden-loader" aria-hidden="true">
            <div className="golden-loader-ring">
              <div className="golden-loader-spinner" />
            </div>
          </div>
          <div>
            <p className="workspace-eyebrow spinning-label">
              Golden hour thinking
            </p>
            <h1>
              <DecryptedText
                text="How can I help you today?"
                className="hero-title-text"
                encryptedClassName="hero-title-text hero-title-text-encrypted"
                parentClassName="hero-scramble"
                animateOn="view"
                sequential
                revealDirection="center"
                maxIterations={8}
                speed={40}
              />
            </h1>
          </div>
        </div>

        <div className="workspace-prompts">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              className="prompt-card"
              onClick={() => handleStarterPrompt(prompt.text)}
              disabled={isBotLoading}
            >
              <div className="prompt-card-title">{prompt.title}</div>
              <p>{prompt.description}</p>
            </button>
          ))}
        </div>

        <div className="chat-card">
          <div className="chat-heading-row">
            <span>Today</span>
          </div>
          <div className="chat-messages">
            <div className="message-row bot">
              <div className="message-bubble bot">
                I'm here whenever you're ready to share.
              </div>
            </div>
            {isBotLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send Aura a message"
              className="chat-input-inner"
              rows={1}
              disabled={isBotLoading}
            />
          <div className="chat-input-actions">
              <button
                type="button"
                className="tool-btn primary"
                onClick={handleSend}
                disabled={!currentMessage?.trim() || isBotLoading}
              >
                Send
              </button>
            </div>
          </div>
        </div>

          <div className="chat-footer workspace-footer">
          <div className="chat-footer-left">
            <span className="model-pill">OpenAI</span>
            <span className="chip">Supportive</span>
          </div>
          <span>Secure, private conversations</span>
        </div>
      </div>
    </section>
  );
};

export default Workspace;
