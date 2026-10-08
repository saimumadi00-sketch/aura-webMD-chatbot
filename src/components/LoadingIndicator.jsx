import React from 'react';
import '../styles/animations.css';

const LoadingIndicator = () => {
  return (
    <div className="message-row bot">
      <div className="message-bubble bot bounce">
        <p>Aura is thinking...</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
