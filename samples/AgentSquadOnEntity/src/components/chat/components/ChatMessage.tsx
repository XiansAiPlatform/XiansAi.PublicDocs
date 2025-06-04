import React from 'react';

// Assuming Message type is correctly defined and imported elsewhere if needed for props
// For example, if it were from types.ts:
// import { ChatMessage as Message } from '../../../types';

// Using the interface directly as it was in the original file for self-containment here.
interface Message {
  id: string;
  content: string;
  direction: 'Incoming' | 'Outgoing' | 'Handover';
}

interface ChatMessageProps {
  message: Message;
}

// Function to format message content with line breaks and basic markdown
const formatMessageContent = (content: string): JSX.Element => {
  // Split by line breaks and process each line
  const lines = content.split('\n');
  
  return (
    <>
      {lines.map((line, lineIndex) => {
        if (line.trim() === '') {
          return <br key={lineIndex} />;
        }
        
        // Process markdown-like formatting within each line
        let formattedLine: (string | JSX.Element)[] = [line];
        
        // Bold text **text** or __text__
        formattedLine = formattedLine.flatMap((segment, segIndex) => {
          if (typeof segment !== 'string') return segment;
          
          const boldRegex = /(\*\*|__)(.*?)\1/g;
          const parts: (string | JSX.Element)[] = [];
          let lastIndex = 0;
          let match;
          
          while ((match = boldRegex.exec(segment)) !== null) {
            if (match.index > lastIndex) {
              parts.push(segment.slice(lastIndex, match.index));
            }
            parts.push(
              <strong key={`${lineIndex}-${segIndex}-bold-${match.index}`}>
                {match[2]}
              </strong>
            );
            lastIndex = match.index + match[0].length;
          }
          
          if (lastIndex < segment.length) {
            parts.push(segment.slice(lastIndex));
          }
          
          return parts.length > 0 ? parts : [segment];
        });
        
        // Italic text *text* or _text_
        formattedLine = formattedLine.flatMap((segment, segIndex) => {
          if (typeof segment !== 'string') return segment;
          
          const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
          const parts: (string | JSX.Element)[] = [];
          let lastIndex = 0;
          let match;
          
          while ((match = italicRegex.exec(segment)) !== null) {
            if (match.index > lastIndex) {
              parts.push(segment.slice(lastIndex, match.index));
            }
            parts.push(
              <em key={`${lineIndex}-${segIndex}-italic-${match.index}`}>
                {match[1] || match[2]}
              </em>
            );
            lastIndex = match.index + match[0].length;
          }
          
          if (lastIndex < segment.length) {
            parts.push(segment.slice(lastIndex));
          }
          
          return parts.length > 0 ? parts : [segment];
        });
        
        // Code text `code`
        formattedLine = formattedLine.flatMap((segment, segIndex) => {
          if (typeof segment !== 'string') return segment;
          
          const codeRegex = /`([^`]+)`/g;
          const parts: (string | JSX.Element)[] = [];
          let lastIndex = 0;
          let match;
          
          while ((match = codeRegex.exec(segment)) !== null) {
            if (match.index > lastIndex) {
              parts.push(segment.slice(lastIndex, match.index));
            }
            parts.push(
              <code 
                key={`${lineIndex}-${segIndex}-code-${match.index}`}
                className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono"
              >
                {match[1]}
              </code>
            );
            lastIndex = match.index + match[0].length;
          }
          
          if (lastIndex < segment.length) {
            parts.push(segment.slice(lastIndex));
          }
          
          return parts.length > 0 ? parts : [segment];
        });
        
        return (
          <div key={lineIndex} className={lineIndex > 0 ? "mt-1" : ""}>
            {formattedLine}
          </div>
        );
      })}
    </>
  );
};

const ChatMessageDisplay: React.FC<ChatMessageProps> = ({ message }) => {
  // console.log(`[ChatMessageDisplay] Rendering message ID: ${message.id}, direction: ${message.direction}`);
  if (message.direction === 'Handover') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
          {formatMessageContent(message.content)}
        </div>
      </div>
    );
  }

  const isUser = message.direction === 'Incoming';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`inline-block rounded-lg px-3 py-2 text-sm shadow ${
          isUser
            ? 'bg-gray-100 text-gray-800 text-right border border-gray-200 max-w-[75%]'
            : 'bg-white border border-gray-200 text-gray-800 max-w-[85%]'
        }`}
      >
        {formatMessageContent(message.content)}
      </div>
    </div>
  );
};

// Memoize ChatMessageDisplay for performance. It will only re-render if its `message` prop changes.
const ChatMessage = React.memo(ChatMessageDisplay);

export default ChatMessage; 