/*
 * Conversation navigation and portal links. Mutations are delegated to callbacks so this component does not own chat storage.
 */

import React, { useEffect, useRef } from 'react';
import { Brain, MessageCircle, SlidersHorizontal, Stethoscope } from 'lucide-react';

const Sidebar = ({
  user,
  conversations = [],
  onNewConversation,
  onOpenConversation,
  onRenameConversation,
  onDeleteConversation,
  onOpenPreferences,
  onManageBilling,
  onHome,
  isOpen = false,
  onClose,
}) => {
  const closeButtonRef = useRef(null);
  useEffect(() => { if (isOpen) closeButtonRef.current?.focus(); }, [isOpen]);

  return (
    <aside id="chat-sidebar" className={`sidebar ${isOpen ? 'is-open' : ''}`} aria-label="Chat navigation" onKeyDown={event => {
      if (!isOpen || event.key !== 'Tab' || !window.matchMedia('(max-width: 900px)').matches) return;
      const controls = [...event.currentTarget.querySelectorAll('button, a[href]')].filter(el => !el.disabled && el.getBoundingClientRect().width > 0);
      const target = event.shiftKey ? controls.at(-1) : controls[0];
      if (document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1))) { event.preventDefault(); target?.focus(); }
    }}>
      <button ref={closeButtonRef} type="button" className="sidebar-close pill" aria-label="Close navigation" onClick={onClose}>✕ Close</button>
      <div className="sidebar-header">
        <button className="logo" type="button" onClick={() => onHome?.()}>
          <Brain size={23} className="sidebar-brand-icon" aria-hidden="true" />
          Aura
        </button>
        <button className="new-chat-btn" type="button" onClick={onNewConversation}>
          <span className="icon">+</span>
          New chat
        </button>
      </div>

      <div>
        <div className="sidebar-section-label">Navigation</div>
        <button type="button" className="nav-item" onClick={onNewConversation}>
          <span className="nav-icon"><MessageCircle size={18} /></span>
          Chats
        </button>
        <button type="button" className="nav-item" onClick={onOpenPreferences}>
          <span className="nav-icon"><SlidersHorizontal size={18} /></span>
          AI Preferences
        </button>
        <a
          className="nav-item"
          href="#/doctors"
        >
          <span className="nav-icon"><Stethoscope size={18} /></span>
          Seek human help
        </a>
      </div>

      <div>
        <div className="sidebar-section-label">Recents</div>
        <ul className="sidebar-list">
          {conversations.length ? (
            conversations.map((conversation) => (
              <li
                key={conversation.id}
                className="recent-item saved"
              >
                <button type="button" className="recent-open" onClick={() => onOpenConversation(conversation.id)} title={conversation.title}>
                  <span className="recent-dot" />
                  <span className="recent-title">{conversation.title}</span>
                </button>
                <div className="recent-actions">
                  <button
                    type="button"
                    onClick={(e) => {
                      // Keep the nested rename action from also opening the conversation row.
                      e.stopPropagation();
                      onRenameConversation(conversation.id);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="recent-item">
              <span className="recent-dot" />
              <span className="recent-title">No saved chats yet</span>
            </li>
          )}
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="profile">
          <span className="avatar">
            {(user?.displayName || user?.email || "Guest")[0]?.toUpperCase()}
          </span>
          <div>
            {user?.displayName || user?.email || "Guest"}
            <div>{user?.isGuest ? "Guest session" : "Free plan"}</div>
          </div>
        </div>
        <button type="button" className="signout-btn" onClick={onManageBilling}>
          Manage
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

