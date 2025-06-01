import React, { useState, useEffect } from 'react';
import { AiOutlineRobot } from 'react-icons/ai';
import { useSteps } from '../context/StepsContext';
import { getThemeColors } from '../steps';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

const ChatPane: React.FC = () => {
  const { steps, activeStep } = useSteps();
  const currentStep = steps[activeStep];
  const hasBot = Boolean(currentStep.bot);

  // Get theme colors from the theme name
  const themeColors = getThemeColors(currentStep.theme);

  // Initialise a separate message history per step
  const [messageHistories, setMessageHistories] = useState<Message[][]>(() => {
    return steps.map((step) =>
      step.bot
        ? [{ role: 'bot', content: `Hello! I'm ${step.bot.title}. How can I help you?` }]
        : []
    );
  });

  // Re-initialise history array if the number of steps changes (unlikely at runtime but keeps hook safe)
  useEffect(() => {
    setMessageHistories((prev) => {
      if (prev.length === steps.length) return prev;
      return steps.map((step, idx) => prev[idx] ?? (step.bot ? [{ role: 'bot', content: `Hello! I'm ${step.bot.title}. How can I help you?` }] : []));
    });
  }, [steps.length]);

  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const currentMessages = messageHistories[activeStep] ?? [];

  const sendMessage = (messageContent: string) => {
    if (!messageContent.trim() || !hasBot) return;

    const trimmed = messageContent.trim();
    const newMessage: Message = { role: 'user', content: trimmed };

    setMessageHistories((prev) => {
      const updated = [...prev];
      updated[activeStep] = [...(updated[activeStep] ?? []), newMessage];
      return updated;
    });

    // Hide suggestions after first interaction
    setShowSuggestions(false);

    // Fake bot response
    setTimeout(() => {
      const botResponse: Message = {
        role: 'bot',
        content: `${currentStep.bot?.title}: I received "${trimmed}". How else can I help?`,
      };
      setMessageHistories((prev) => {
        const updated = [...prev];
        updated[activeStep] = [...(updated[activeStep] ?? []), botResponse];
        return updated;
      });
    }, 400);
  };

  const handleSend = () => {
    sendMessage(input);
    setInput('');
  };

  // Auto-toggle suggestions visibility when step changes
  useEffect(() => {
    setShowSuggestions((currentMessages?.length ?? 0) <= 1);
  }, [activeStep]);

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
      {/* Bot header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3 w-full max-w-sm ml-auto">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${themeColors.bg}`}>
            <AiOutlineRobot />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 tracking-tight text-balance">{currentStep.bot?.title}</h3>
            {currentStep.bot?.description && (
              <p className="text-xs text-gray-500 font-normal">{currentStep.bot.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="w-full max-w-sm ml-auto space-y-4">
          {currentMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow ${
                msg.role === 'user'
                  ? 'ml-auto bg-primary-light text-white text-right'
                  : 'mr-auto bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions (very minimal generic for illustration) */}
      {showSuggestions && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <div className="w-full max-w-sm ml-auto">
            <p className="text-xs text-gray-500 mb-2 font-medium">Example prompts:</p>
            <div className="flex flex-wrap gap-2">
              {['Can you assist me?', 'What should I do next?'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 font-medium ${themeColors.bgLight} ${themeColors.text} ${themeColors.border}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2 w-full max-w-sm ml-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${currentStep.bot?.title ?? 'the bot'}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2 bg-primary-light text-white text-sm rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPane; 