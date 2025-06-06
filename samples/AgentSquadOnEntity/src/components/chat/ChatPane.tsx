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
  const { activeStep, isInitialized } = useSteps();
  const { chatMessages } = useWebSocketSteps();
  
  // Custom hooks for state management
  const {
    currentStep,
    currentAgent,
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

  // Show loading state if not initialized or no currentStep
  if (!isInitialized || !currentStep) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <div className="text-gray-500 text-sm">
            {!isInitialized ? 'Initializing...' : 'Loading step data...'}
          </div>
        </div>
      </div>
    );
  }

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
        bot={currentAgent || currentStep.bot!}
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
        botTitle={currentAgent?.title || currentStep.bot?.title}
        isStepConnected={isStepConnected}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatPane; 