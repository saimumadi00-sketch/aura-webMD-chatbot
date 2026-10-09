/*
 * Inline bot placeholder while chat or summary work is pending; it reflects parent state rather than polling a service.
 */

import React from 'react';
import '../styles/animations.css';

const LoadingIndicator = () => {
  return (
    <div className="message-row bot">
      <div className="message-bubble bot typing-indicator" role="status">
        <span>Aura is thinking</span>
        <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
      </div>
    </div>
  );
};

export default LoadingIndicator;
