import React from 'react';
import { getThemeColors } from '../../theme';

interface SuggestionButtonsProps {
  theme: string;
  isTyping: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({
  theme,
  isTyping,
  onSuggestionClick,
}) => {
  const themeColors = getThemeColors(theme);
  const suggestions = ['Can you assist me?', 'What should I do next?'];

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-white">
      <div className="w-full max-w-sm ml-auto">
        <p className="text-xs text-gray-500 mb-2 font-medium">Example prompts:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              disabled={isTyping}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 font-medium ${themeColors.bgLight} ${themeColors.text} ${themeColors.border} disabled:opacity-50`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestionButtons; 