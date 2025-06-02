import React, { useState, useEffect } from 'react';
import { useSteps } from '../../context/StepsContext';
import { useWebSocketSteps } from '../../context/WebSocketStepsContext';

// Custom hooks
import { useChatMessages } from './hooks/useChatMessages';
import { useTypingState } from './hooks/useTypingState';
import { useChatScrolling } from './hooks/useChatScrolling';

// Components
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import SuggestionButtons from './components/SuggestionButtons';
import ChatInput from './components/ChatInput';

const ChatPane: React.FC = () => {
  const { activeStep } = useSteps();
  const { chatMessages } = useWebSocketSteps();
  
  // Custom hooks for state management
  const {
    currentStep,
    hasBot,
    currentMessages,
    connectionState,
    isStepConnected,
    sendMessage,
    connectionStatusMessage,
  } = useChatMessages();

  const { isTyping, setIsTyping, typingStage } = useTypingState(currentMessages);
  
  const {
    isChatHistoryLoading,
    hasInitiallyLoaded,
    messagesEndRef,
    scrollContainerRef,
    scrollToBottom,
  } = useChatScrolling(activeStep, chatMessages);

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Auto-toggle suggestions visibility when step changes
  useEffect(() => {
    setShowSuggestions(currentMessages.length === 0);
  }, [activeStep, currentMessages.length]);

  // Handle sending messages
  const handleSendMessage = async (messageText: string) => {
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  // Handle suggestion clicks
  const handleSuggestion = async (suggestion: string) => {
    await handleSendMessage(suggestion);
  };

  // Early return if no bot configured for this step
  if (!hasBot) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500 text-sm p-4 text-center">
        Chat is not available for the "{currentStep.title}" step.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        bot={currentStep.bot!}
        theme={currentStep.theme}
        connectionState={connectionState}
        isStepConnected={isStepConnected}
      />

      <MessageList
        messages={currentMessages}
        isTyping={isTyping}
        typingStage={typingStage}
        connectionStatusMessage={connectionStatusMessage}
        isChatHistoryLoading={isChatHistoryLoading}
        hasInitiallyLoaded={hasInitiallyLoaded}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
        scrollToBottom={scrollToBottom}
      />

      {showSuggestions && isStepConnected && (
        <SuggestionButtons
          theme={currentStep.theme}
          isTyping={isTyping}
          onSuggestionClick={handleSuggestion}
        />
      )}

      <ChatInput
        botTitle={currentStep.bot?.title}
        isStepConnected={isStepConnected}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatPane; 