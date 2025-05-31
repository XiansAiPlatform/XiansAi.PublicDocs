import React, { useState, useEffect } from 'react';
import { AiOutlineRobot } from 'react-icons/ai';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface ChatPaneProps {
  activeStep: number;
}

// Define bots for each step
const stepBots = [
  {
    name: 'Requirements Bot',
    description: 'Helps gather and clarify requirements',
    color: 'bg-blue-500',
    initialMessage: 'Hello! I\'m here to help you gather and clarify the requirements for your document. What do you need help with?'
  },
  {
    name: 'Draft Bot',
    description: 'Assists with drafting content',
    color: 'bg-green-500',
    initialMessage: 'Hi! I\'m your drafting assistant. I can help you create and structure the content for your document. What would you like to work on?'
  },
  {
    name: 'Review Bot',
    description: 'Reviews and suggests improvements',
    color: 'bg-amber-500',
    initialMessage: 'Hello! I\'m here to help review your document and suggest improvements. Let\'s make sure everything looks good!'
  },
  {
    name: 'Finalize Bot',
    description: 'Helps finalize and polish the document',
    color: 'bg-purple-500',
    initialMessage: 'Hi! I\'m here to help you finalize and polish your document. Let\'s get it ready for completion!'
  }
];

const ChatPane: React.FC<ChatPaneProps> = ({ activeStep }) => {
  // Separate message histories for each step
  const [messageHistories, setMessageHistories] = useState<Message[][]>(() => {
    return stepBots.map((bot, index) => [
      { role: 'bot', content: bot.initialMessage }
    ]);
  });

  const [input, setInput] = useState('');

  const currentBot = stepBots[activeStep];
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
      const botResponse = `${currentBot.name}: I understand you're working on "${input.trim()}". How can I help you with this in the ${stepBots[activeStep].description.toLowerCase()} phase?`;
      
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${currentBot.color}`}>
            <AiOutlineRobot />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900">{currentBot.name}</h3>
            <p className="text-xs text-gray-500">{currentBot.description}</p>
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
                  ? 'ml-auto bg-primary-light text-white text-right' 
                  : 'mr-auto bg-gray-100 text-gray-800 text-left'}`}
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-primary-light text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-primary-light text-white text-sm rounded disabled:opacity-50"
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