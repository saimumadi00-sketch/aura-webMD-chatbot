/*
 * Empty-thread introduction: starter cards use the normal send action; ChatActive keeps the composer mounted.
 */

import React from 'react';
import { Brain } from 'lucide-react';

const Workspace = ({
  handleStarterPrompt,
  isBotLoading,
}) => {
  // Titles are presentation; text is the actual message sent through the normal chat flow.
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
        <div className="workspace-intro">
        <div className="workspace-hero">
          <div className="workspace-mark" aria-hidden="true"><Brain size={26} /></div>
          <div>
            <p className="workspace-eyebrow">
              A moment for yourself
            </p>
            <h1>
              How can I help you today?
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
        </div>
      </div>
    </section>
  );
};

export default Workspace;
