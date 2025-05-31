import React, { useState, useEffect } from 'react';
import { AiOutlineRobot } from 'react-icons/ai';
import { STEP_BOTS } from '../utils/botColors';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface ChatPaneProps {
  activeStep: number;
}

// Suggested messages for each bot type
const SUGGESTED_MESSAGES = [
  // Requirements Bot suggestions
  [
    "What are the key requirements for this document?",
    "Help me define the scope and objectives",
    "What stakeholders should be considered?",
    "What are the success criteria?"
  ],
  // Draft Bot suggestions
  [
    "Help me create an outline",
    "What sections should this document have?",
    "Can you help me write the introduction?",
    "How should I structure this content?"
  ],
  // Review Bot suggestions
  [
    "Please review this section for clarity",
    "Are there any inconsistencies?",
    "What improvements can be made?",
    "Check for completeness and accuracy"
  ],
  // Finalize Bot suggestions
  [
    "Is the document ready for publication?",
    "Final formatting and style check",
    "Are all sections complete?",
    "What final touches are needed?"
  ]
];

const ChatPane: React.FC<ChatPaneProps> = ({ activeStep }) => {
  // Separate message histories for each step
  const [messageHistories, setMessageHistories] = useState<Message[][]>(() => {
    return STEP_BOTS.map((bot, index) => [
      { role: 'bot', content: bot.initialMessage }
    ]);
  });

  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const currentBot = STEP_BOTS[activeStep];
  const currentMessages = messageHistories[activeStep];
  const currentSuggestions = SUGGESTED_MESSAGES[activeStep];

  const sendMessage = (messageContent: string) => {
    if (!messageContent.trim()) return;

    const newMessage: Message = { role: 'user', content: messageContent.trim() };
    
    setMessageHistories(prev => {
      const updated = [...prev];
      updated[activeStep] = [...updated[activeStep], newMessage];
      return updated;
    });

    // Hide suggestions after sending a message
    setShowSuggestions(false);

    // Placeholder bot response with step-specific context
    setTimeout(() => {
      const botResponse = `${currentBot.name}: I understand you're working on "${messageContent.trim()}". How can I help you with this in the ${STEP_BOTS[activeStep].description.toLowerCase()} phase?`;
      
      setMessageHistories(prev => {
        const updated = [...prev];
        updated[activeStep] = [...updated[activeStep], { role: 'bot', content: botResponse }];
        return updated;
      });
    }, 500);
  };

  const handleSend = () => {
    sendMessage(input);
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  useEffect(() => {
    // Show suggestions when switching to a new step or when there are only initial messages
    setShowSuggestions(currentMessages.length <= 1);
  }, [activeStep, currentMessages.length]);

  useEffect(() => {
    const listener = (event: any) => {
      if (event?.detail?.content) {
        setMessageHistories(prev => {
          const updated = [...prev];
          updated[activeStep] = [...updated[activeStep], { role: 'user', content: event.detail.content }];
          return updated;
        });
      }
    };
    window.addEventListener('externalChatMessage', listener);
    return () => {
      window.removeEventListener('externalChatMessage', listener);
    };
  }, [activeStep]);

  return (
    <div className="flex flex-col h-full">
      {/* Bot Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3 w-full max-w-sm ml-auto">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${currentBot.colors.bg}`}>
            <AiOutlineRobot />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 tracking-tight text-balance">{currentBot.name}</h3>
            <p className="text-xs text-gray-500 font-normal">{currentBot.description}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="w-full max-w-sm ml-auto space-y-4">
          {currentMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow
                ${msg.role === 'user' 
                  ? 'ml-auto bg-primary-light text-white text-right font-normal leading-relaxed' 
                  : 'mr-auto bg-gray-100 text-gray-800 text-left font-normal leading-relaxed'}`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Messages */}
      {showSuggestions && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <div className="w-full max-w-sm ml-auto">
            <p className="text-xs text-gray-500 mb-2 font-medium">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {currentSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 hover:shadow-sm
                    ${currentBot.colors.bgLight} ${currentBot.colors.text} ${currentBot.colors.border}
                    hover:scale-105 active:scale-95 font-medium`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Suggestions Toggle */}
      {!showSuggestions && (
        <div className="px-4 py-2 border-t border-gray-100 bg-white">
          <div className="w-full max-w-sm ml-auto">
            <button
              onClick={() => setShowSuggestions(true)}
              className={`text-xs font-medium transition-all duration-200 hover:scale-105 px-2 py-1 rounded
                ${currentBot.colors.text} hover:${currentBot.colors.bgLight}`}
            >
              Suggestions
            </button>
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
            placeholder={`Ask ${currentBot.name}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-primary-light text-sm font-normal"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            onFocus={() => setShowSuggestions(false)}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-primary-light text-white text-sm rounded disabled:opacity-50 font-medium transition-colors"
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPane; 