import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../../types'; // Assuming ChatMessage type is available

type TypingStage = 'contacting' | 'waiting' | 'long-wait';

export const useTypingState = (currentMessages: ChatMessage[]) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingStage, setTypingStage] = useState<TypingStage>('contacting');
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const lastProcessedMessageCountRef = useRef(currentMessages.length);

  // Effect to stop typing indicator ONLY when a new BOT message arrives
  useEffect(() => {
    const currentTotalMessages = currentMessages.length;
    
    // Only proceed if we are currently in a typing state and there are new messages
    if (isTyping && currentTotalMessages > lastProcessedMessageCountRef.current) {
      const latestMessage = currentMessages[currentTotalMessages - 1];
      
      // console.log('[useTypingState] New message detected while typing:', latestMessage);

      // Stop typing ONLY if the newest message is from the bot ('Outgoing')
      if (latestMessage && latestMessage.direction === 'Outgoing') {
        // console.log('[useTypingState] Bot response received. Stopping typing.');
        setIsTyping(false);
      }
    }
    // Update the ref to the current message count for the next comparison
    lastProcessedMessageCountRef.current = currentTotalMessages;
  }, [currentMessages, isTyping]); // Rerun when messages change or typing state changes

  // Handle typing stage transitions AND add a maximum timeout
  useEffect(() => {
    if (!isTyping) {
      setTypingStage('contacting');
      setTypingStartTime(null);
      return;
    }

    // If typing just started, set the start time and initial stage
    if (typingStartTime === null) {
      setTypingStartTime(Date.now());
      setTypingStage('contacting');
    }

    const timer1 = setTimeout(() => {
      setTypingStage('waiting');
    }, 5000); // 5 seconds to 'waiting'

    const timer2 = setTimeout(() => {
      setTypingStage('long-wait');
    }, 35000); // 35 seconds total (5 + 30) to 'long-wait'

    // Safety timeout: stop typing after 60 seconds regardless
    const maxTimeout = setTimeout(() => {
      // console.log('[useTypingState] Maximum 60s typing timeout reached. Stopping typing.');
      setIsTyping(false);
    }, 60000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(maxTimeout);
    };
  }, [isTyping, typingStartTime]);

  return {
    isTyping,
    setIsTyping, // Make sure ChatPane can still call setIsTyping(true) when sending a message
    typingStage,
  };
}; 