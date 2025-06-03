import React from 'react';
import { AiOutlineRobot } from 'react-icons/ai';
import { getThemeColors } from '../../power-of-attorney/theme';

interface ChatHeaderProps {
  bot: {
    title: string;
    description?: string;
  };
  theme: string;
  connectionState?: {
    status: string;
  };
  isStepConnected: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  bot, 
  theme, 
  connectionState, 
  isStepConnected 
}) => {
  const themeColors = getThemeColors(theme);

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3 w-full max-w-sm ml-auto">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${themeColors.bg}`}>
          <AiOutlineRobot />
        </div>
        <div className="text-left flex-1">
          <h3 className="font-semibold text-gray-900 tracking-tight text-balance">{bot.title}</h3>
          {bot.description && (
            <p className="text-xs text-gray-500 font-normal">{bot.description}</p>
          )}
        </div>
        {connectionState && (
          <div className={`w-2 h-2 rounded-full ${
            isStepConnected ? 'bg-green-500' : 
            connectionState.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`} title={connectionState.status} />
        )}
      </div>
    </div>
  );
};

export default ChatHeader; 