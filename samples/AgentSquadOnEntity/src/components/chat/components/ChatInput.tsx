import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  botTitle?: string;
  isStepConnected: boolean;
  isTyping: boolean;
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  botTitle,
  isStepConnected,
  isTyping,
  onSendMessage,
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!input.trim() || !isStepConnected || isTyping) return;
    
    const messageText = input.trim();
    setInput('');
    onSendMessage(messageText);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const prevIsTypingRef = useRef(isTyping);
  useEffect(() => {
    if (prevIsTypingRef.current === true && isTyping === false) {
      inputRef.current?.focus();
    }
    prevIsTypingRef.current = isTyping;
  }, [isTyping]);

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="flex gap-2 w-full max-w-sm ml-auto">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${botTitle ?? 'the bot'}...`}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring text-sm"
          onKeyDown={handleKeyDown}
          disabled={!isStepConnected || isTyping}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !isStepConnected || isTyping}
          className="px-4 py-2 bg-primary-light text-white text-sm rounded disabled:opacity-50"
        >
          {isTyping ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatInput; 