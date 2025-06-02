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

const ChatMessageDisplay: React.FC<ChatMessageProps> = ({ message }) => {
  // console.log(`[ChatMessageDisplay] Rendering message ID: ${message.id}, direction: ${message.direction}`);
  if (message.direction === 'Handover') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
          {message.content}
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
        {message.content}
      </div>
    </div>
  );
};

// Memoize ChatMessageDisplay for performance. It will only re-render if its `message` prop changes.
const ChatMessage = React.memo(ChatMessageDisplay);

export default ChatMessage; 