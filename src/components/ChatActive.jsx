import React, { useRef, useState } from 'react';
import { useAutoScroll } from '../utils/helpers';
import LoadingIndicator from './LoadingIndicator';

const MessageBubble = ({ msg, user }) => {
  const isUser = msg.sender === 'user' || msg.sender === user?.id;
  const imageMatch = msg.text?.match(/data:image[^;]+;base64,[^\s)]+/i);
  const imageSrc = imageMatch?.[0];
  const imageLabel = msg.text?.match(/Image uploaded: ([^.]*)/)?.[1];
  let cleanedText = msg.text || '';
  if (imageLabel) cleanedText = cleanedText.replace(`Image uploaded: ${imageLabel}.`, '');
  if (imageSrc) cleanedText = cleanedText.replace(imageSrc, '');
  cleanedText = cleanedText.trim();
  const showImage = isUser && !!imageSrc;
  const displayText = cleanedText || (imageSrc && !showImage ? "[image content omitted]" : msg.text);

  const rowClass = `message-row ${isUser ? 'user' : 'bot'} slide-in ${isUser ? '' : 'fade-in'}`;
  const bubbleClass = `message-bubble ${isUser ? 'user' : 'bot bot-response'} ${isUser ? '' : 'fade-in'}`;

  return (
    <div className={rowClass}>
      <div className={bubbleClass}>
        {showImage ? (
          <div className="message-image">
            {cleanedText && <p className="message-text">{cleanedText}</p>}
            <img src={imageSrc} alt={imageLabel || 'Uploaded image'} />
            <p className="message-caption">{imageLabel ? `Image: ${imageLabel}` : 'Image uploaded'}</p>
          </div>
        ) : (
          <p>{displayText}</p>
        )}
      </div>
    </div>
  );
};

const ChatActive = ({
  messages,
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  isBotLoading,
  user,
}) => {
  const messagesEndRef = useAutoScroll([messages]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const clearImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    const text = currentMessage?.trim() || '';
    if ((!text && !uploadedImage) || isBotLoading || isUploading) return;

    const payload = uploadedImage
      ? [text, `Image uploaded: ${uploadedImage.name}.`, uploadedImage.dataUrl].filter(Boolean).join('\n\n')
      : text;

    onSendMessage(payload);
    clearImage();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || isBotLoading) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setUploadedImage({ dataUrl: base64, name: file.name });
      setTimeout(() => textareaRef.current?.focus(), 0);
    };
    reader.onerror = () => {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="chat-active">
      <div className="chat-active-messages">
        {messages.map((msg) => (
          <MessageBubble key={msg.id ?? msg.createdAt} msg={msg} user={user} />
        ))}
        {isBotLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-active-composer">
        <textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message"
          rows={1}
          disabled={isBotLoading}
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
          {isUploading ? '...' : '+'}
        </button>
          <button
            type="button"
            className="tool-btn primary"
            onClick={handleSend}
            disabled={(!currentMessage?.trim() && !uploadedImage) || isBotLoading || isUploading}
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
};

export default ChatActive;


