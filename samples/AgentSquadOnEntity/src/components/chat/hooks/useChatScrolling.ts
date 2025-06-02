import { useState, useEffect, useRef, useCallback } from 'react';

const SCROLL_THRESHOLD = 50; // Pixels from bottom to consider "at bottom"

export const useChatScrolling = (activeStep: number, chatMessages: Map<number, any[]>) => {
  const [isChatHistoryLoading, setIsChatHistoryLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable container

  // Check if the user is scrolled to the bottom of the chat area
  const isScrolledToBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true; // Assume at bottom if no container
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // console.log('[useChatScrolling] Scroll check:', { scrollTop, scrollHeight, clientHeight, diff: scrollHeight - scrollTop - clientHeight });
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }, []);

  // Handle initial chat history loading & scroll to bottom
  useEffect(() => {
    setIsChatHistoryLoading(true);
    setHasInitiallyLoaded(false);
    
    const checkMessages = () => {
      const messages = chatMessages.get(activeStep) || [];
      if (messages.length > 0 || Date.now() - startTime > 2000) {
        setTimeout(() => {
          setIsChatHistoryLoading(false);
          setTimeout(() => {
            setHasInitiallyLoaded(true);
            setTimeout(() => {
              if (messagesEndRef.current) {
                // console.log('[useChatScrolling] Initial load: Scrolling to bottom (auto).');
                messagesEndRef.current.scrollIntoView({ 
                  behavior: 'auto', // Instant scroll for initial load
                  block: 'end',
                  inline: 'nearest'
                });
              }
            }, 50);
          }, 100);
        }, 300);
      } else {
        setTimeout(checkMessages, 100);
      }
    };
    
    const startTime = Date.now();
    checkMessages();
  }, [activeStep, chatMessages]);

  // Scroll to bottom intelligently when new messages arrive or typing status changes
  const scrollToBottom = useCallback((forceSmooth: boolean = false) => {
    if (!hasInitiallyLoaded || !messagesEndRef.current) return;

    if (forceSmooth || isScrolledToBottom()) {
      // console.log(`[useChatScrolling] Scrolling to bottom (smooth). Force: ${forceSmooth}`);
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    } else {
      // console.log('[useChatScrolling] User scrolled up. Not auto-scrolling.');
      // Optionally, implement a "New Messages" button here that calls scrollToBottom(true)
    }
  }, [hasInitiallyLoaded, isScrolledToBottom]);

  return {
    isChatHistoryLoading,
    hasInitiallyLoaded,
    messagesEndRef,
    scrollContainerRef, // Expose this ref for the MessageList to use
    scrollToBottom,     // Expose the intelligent scroll function
    isScrolledToBottom, // Expose for potential "New Messages" button logic
  };
}; 