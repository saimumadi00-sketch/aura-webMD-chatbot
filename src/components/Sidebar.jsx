import React from 'react';

const Sidebar = ({
  user,
  conversations,
  onNewConversation,
  onOpenConversation,
  onRenameConversation,
  onDeleteConversation,
  onOpenPreferences,
  onManageBilling,
  onHome,
}) => {
  const doctorsPortalUrl =
    import.meta.env.VITE_DOCTORS_PORTAL_URL || '/doctors_portal/index.php';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="logo" type="button" onClick={() => onHome?.()}>
          <span className="logo-mark" />
          Aura
        </button>
        <button className="new-chat-btn" type="button" onClick={onNewConversation}>
          <span className="icon">+</span>
          New chat
        </button>
      </div>

      <div>
        <div className="sidebar-section-label">Navigation</div>
        <div className="nav-item" onClick={onNewConversation}>
          <span className="nav-icon">#</span>
          Chats
        </div>
        <div className="nav-item" onClick={onOpenPreferences}>
          <span className="nav-icon">AI</span>
          AI Preferences
        </div>
        <a
          className="nav-item"
          href={doctorsPortalUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="nav-icon">!</span>
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
                onClick={() => onOpenConversation(conversation.id)}
              >
                <span className="recent-dot" />
                <span className="recent-title">{conversation.title}</span>
                <div className="recent-actions">
                  <button
                    type="button"
                    onClick={(e) => {
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

