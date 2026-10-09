/*
 * Active conversation UI: render messages and package optional images into the existing text-based message contract.
 */

import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Square } from 'lucide-react';
import { parseImageFromMessage } from '../utils/helpers';
import LoadingIndicator from './LoadingIndicator';
import MessageContent from './MessageContent';
import useConversationScroll from '../hooks/useConversationScroll';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import '../styles/chat.css';

const MessageBubble = memo(function MessageBubble({ msg, user, onImageLoad, animate }) {
  const isUser = msg.sender === 'user' || msg.sender === user?.id;
  // Image attachments share the text field; remove their markers from the visible caption.
  const { dataUrl: imageSrc, label: imageLabel, cleanText: cleanedText } = parseImageFromMessage(msg.text || '');
  const showImage = isUser && !!imageSrc;
  const displayText = cleanedText || (imageSrc && !showImage ? "[image content omitted]" : msg.text);

  const [animateEntry] = useState(animate);
  const rowClass = `message-row ${isUser ? 'user' : 'bot'} ${animateEntry ? 'chat-message-entry' : ''}`;
  const bubbleClass = `message-bubble ${isUser ? 'user' : 'bot'} ${msg.streaming ? 'is-streaming' : ''}`;

  return (
    <div className={rowClass}>
      <div className={bubbleClass}>
        {showImage ? (
          <div className="message-image">
            {cleanedText && <p className="message-text">{cleanedText}</p>}
            <img src={imageSrc} onLoad={onImageLoad} alt={imageLabel || 'Uploaded image'} />
            <p className="message-caption">{imageLabel ? `Image: ${imageLabel}` : 'Image uploaded'}</p>
          </div>
        ) : (
          <MessageContent text={displayText} plain={isUser} />
        )}
        {msg.streaming && <span className="reply-progress" aria-label="Aura is responding" />}
      </div>
    </div>
  );
});

const ChatActive = ({
  messages,
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  isBotLoading,
  canStopReply,
  onStopReply,
  user,
  emptyState,
  threadKey,
}) => {
  const { panelRef, contentRef, showLatest, scrollToLatest, interrupt, onScroll, onContentResize } = useConversationScroll(messages, isBotLoading, threadKey);
  const reduceMotion = useReducedMotion();
  // Track incoming IDs as render state so restored threads do not replay entry motion.
  const [entries, setEntries] = useState({ messages, threadKey, animated: new Set() });
  if (entries.messages !== messages || entries.threadKey !== threadKey) {
    const sameThread = entries.threadKey === threadKey && (!entries.messages[0] || entries.messages[0].id === messages[0]?.id);
    const previousIds = new Set(entries.messages.map(message => message.id));
    setEntries({ messages, threadKey, animated: new Set(sameThread ? messages.filter(message => !previousIds.has(message.id)).map(message => message.id) : []) });
  }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  useEffect(() => {
    if (!messages.length) {
      setUploadedImage(null);
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [messages.length]);
  // Grow with a multiline draft while keeping long drafts independently scrollable.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [currentMessage]);

  // Reset both React state and the native input so the same file can be selected again.
  const clearImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    const text = currentMessage?.trim() || '';
    if ((!text && !uploadedImage) || isBotLoading || isUploading) return;

    // Keep attachment serialization compatible with formatChatHistory and PDF parsing.
    const payload = uploadedImage
      ? [text, `Image uploaded: ${uploadedImage.name}.`, uploadedImage.dataUrl].filter(Boolean).join('\n\n')
      : text;

    onSendMessage(payload);
    clearImage();
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || isBotLoading) return;
    setUploadError(null);
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 512 * 1024) {
      setUploadError('Choose a PNG, JPEG, WebP, or GIF image up to 512 KB.');
      event.target.value = '';
      return;
    }
    setIsUploading(true);

    // Read into a data URL locally; uploading to the model happens only when Send is pressed.
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setUploadedImage({ dataUrl: base64, name: file.name });
      setTimeout(() => textareaRef.current?.focus(), 0);
    };
    reader.onerror = () => {
      setUploadError('The image could not be read. Please try another file.');
      setIsUploading(false);
      if (event?.target) event.target.value = '';
    };
    reader.onloadend = () => {
      setIsUploading(false);
      if (event?.target) event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="chat-active">
      <div className="chat-scroll-region">
      <div ref={panelRef} className={`chat-active-messages ${emptyState ? 'chat-empty-panel' : ''}`} onWheel={interrupt} onTouchStart={interrupt} onKeyDown={event => { if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key)) interrupt(); }} onScroll={onScroll} tabIndex={0} role={emptyState ? undefined : 'log'} aria-label="Conversation" aria-live="polite" aria-relevant="additions">
        <AnimatePresence initial={false}>
          {emptyState && <motion.div key="welcome" className="chat-welcome" exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>{emptyState}</motion.div>}
        </AnimatePresence>
        <div className="chat-thread" ref={contentRef}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id ?? msg.createdAt} msg={msg} user={user} onImageLoad={onContentResize} animate={entries.animated.has(msg.id)} />
        ))}
        {isBotLoading && !messages.some(message => message.streaming) && <LoadingIndicator />}
        </div>
      </div>
      {showLatest && <button type="button" className="jump-to-latest" onClick={() => scrollToLatest()}><ArrowDown size={16} />Latest messages</button>}
      </div>
      <div className="chat-active-composer">
        {uploadError && <p role="alert" className="chat-error">{uploadError}</p>}
        <textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Aura"
          aria-label="Message Aura"
          rows={1}
        />
        {uploadedImage && (
          <div className="chat-active-attachment">
            <div className="attachment-thumb">
              <img src={uploadedImage.dataUrl} alt={uploadedImage.name || 'Uploaded image'} />
            </div>
            <div className="attachment-meta">
              <p className="attachment-name">{uploadedImage.name || 'Image attached'}</p>
              <button
                type="button"
                className="attachment-remove"
                onClick={clearImage}
                disabled={isBotLoading}
              >
                Remove
              </button>
            </div>
          </div>
        )}
        <div className="chat-active-controls">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isBotLoading || isUploading}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="tool-btn"
          aria-label="Upload image"
          onClick={() => !isBotLoading && fileInputRef.current?.click()}
          disabled={isBotLoading || isUploading}
        >
          {isUploading ? '...' : <ImagePlus size={19} aria-hidden="true" />}
        </button>
          <span className="composer-hint">{isBotLoading ? 'Aura is responding — you can draft your next message' : 'Enter to send · Shift+Enter for a new line'}</span>
          {canStopReply ? <button type="button" className="tool-btn primary" aria-label="Stop response" onClick={onStopReply}><Square size={14} fill="currentColor" aria-hidden="true" /><span>Stop</span></button> : <button
            type="button"
            className="tool-btn primary"
            aria-label="Send message"
            onClick={handleSend}
            disabled={(!currentMessage?.trim() && !uploadedImage) || isBotLoading || isUploading}
          >
            <ArrowUp size={18} aria-hidden="true" /><span>Send</span>
          </button>}
        </div>
      </div>
      <p className="chat-disclaimer">AI companion · share only what you are comfortable sending</p>
    </section>
  );
};

export default ChatActive;


