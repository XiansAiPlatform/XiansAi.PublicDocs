import React, { useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import LoadingIndicator from './LoadingIndicator';
import { ChatMessage as Message } from '../../../types';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  typingStage: 'contacting' | 'waiting' | 'long-wait';
  connectionStatusMessage: string | null;
  isChatHistoryLoading: boolean;
  hasInitiallyLoaded: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: (forceSmooth?: boolean) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  typingStage,
  connectionStatusMessage,
  isChatHistoryLoading,
  hasInitiallyLoaded,
  messagesEndRef,
  scrollContainerRef,
  scrollToBottom,
}) => {
  // Scroll when messages change or typing status changes - only after initial load
  useEffect(() => {
    if (!hasInitiallyLoaded) return;
    scrollToBottom();
  }, [messages.length, isTyping, hasInitiallyLoaded, scrollToBottom]);

  // Additional effect to ensure scroll on any message array reference change - only after initial load
  useEffect(() => {
    if (!hasInitiallyLoaded) return;
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, hasInitiallyLoaded, scrollToBottom]);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 bg-gray-50"
    >
      <div className="w-full max-w-sm ml-auto space-y-4">
        {connectionStatusMessage && (
          <div className="text-center text-sm text-gray-500 py-4">
            {connectionStatusMessage}
          </div>
        )}
        
        {isChatHistoryLoading ? (
          <LoadingIndicator />
        ) : (
          <div className={`transition-opacity duration-300 space-y-4 ${hasInitiallyLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isTyping && <TypingIndicator typingStage={typingStage} />}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList; 