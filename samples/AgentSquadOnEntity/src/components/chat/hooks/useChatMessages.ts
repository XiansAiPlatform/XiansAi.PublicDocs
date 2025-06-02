import { useState, useEffect } from 'react';
import { useSteps } from '../../../context/StepsContext';
import { useWebSocketSteps } from '../../../context/WebSocketStepsContext';

export const useChatMessages = () => {
  const { steps, activeStep } = useSteps();
  const { chatMessages, sendMessage, isConnected, connectionStates } = useWebSocketSteps();
  
  const currentStep = steps[activeStep];
  const hasBot = Boolean(currentStep.bot);
  const currentMessages = chatMessages.get(activeStep) || [];
  const connectionState = connectionStates.get(activeStep);
  const isStepConnected = connectionState?.status === 'connected';

  const getConnectionStatusMessage = () => {
    if (!isConnected) return 'Not connected to chat service';
    if (!isStepConnected) {
      if (connectionState?.status === 'connecting') return 'Connecting...';
      if (connectionState?.status === 'error') return 'Connection error';
      return 'Disconnected';
    }
    return null;
  };

  return {
    currentStep,
    hasBot,
    currentMessages,
    connectionState,
    isStepConnected,
    isConnected,
    sendMessage,
    connectionStatusMessage: getConnectionStatusMessage(),
  };
}; 