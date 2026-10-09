/*
 * Optional animated suggestion grid. Clicking a sample sends its text to the parent; it performs no API calls.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Expanded suggestions to showcase a wider range of capabilities
const suggestions = [
  "Explain quantum computing in simple terms",
  "Got any creative ideas for a 10 year old's birthday?",
  "How do I make an HTTP request in Javascript?",
  "Write a short story in the style of a classic noir film",
  "Plan a 3-day trip to Tokyo",
  "What are some tips for improving public speaking skills?",
  "Register a new user and set up their profile",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const bubbleVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
  hover: {
    scale: 1.05,
    backgroundColor: "#e0e0e0",
    transition: { type: 'spring', stiffness: 300 },
  }
};

const ChatSuggestions = ({ onSuggestionClick }) => {
  return (
    <motion.div
      className="chat-suggestions-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 className="welcome-header" variants={bubbleVariants}>
        Hello, I'm Aura
      </motion.h2>
      <motion.p className="welcome-subheader" variants={bubbleVariants}>
        Here are a few things you can ask me:
      </motion.p>
      <div className="suggestions-grid">
        {suggestions.map((text, index) => (
          <motion.div
            key={index}
            className="chat-bubble suggestion"
            variants={bubbleVariants}
            whileHover="hover"
            onClick={() => onSuggestionClick && onSuggestionClick(text)}
            // Pass the suggestion text to the parent component on click
          >
            {text}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ChatSuggestions;
