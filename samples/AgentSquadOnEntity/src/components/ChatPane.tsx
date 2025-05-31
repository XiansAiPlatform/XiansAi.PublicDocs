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

const ChatPane: React.FC<ChatPaneProps> = ({ activeStep }) => {
  // Separate message histories for each step
  const [messageHistories, setMessageHistories] = useState<Message[][]>(() => {
    return STEP_BOTS.map((bot, index) => [
      { role: 'bot', content: bot.initialMessage }
    ]);
  });

  const [input, setInput] = useState('');

  const currentBot = STEP_BOTS[activeStep];
  const currentMessages = messageHistories[activeStep];

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: 'user', content: input.trim() };
    
    setMessageHistories(prev => {
      const updated = [...prev];
      updated[activeStep] = [...updated[activeStep], newMessage];
      return updated;
    });

    // Placeholder bot response with step-specific context
    setTimeout(() => {
      const botResponse = `${currentBot.name}: I understand you're working on "${input.trim()}". How can I help you with this in the ${STEP_BOTS[activeStep].description.toLowerCase()} phase?`;
      
      setMessageHistories(prev => {
        const updated = [...prev];
        updated[activeStep] = [...updated[activeStep], { role: 'bot', content: botResponse }];
        return updated;
      });
    }, 500);

    setInput('');
  };

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