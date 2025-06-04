import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { steps, getStepUrlBySlug, getStepUrl } from '../modules/poa/steps';
import { StepDefinition, StepTheme, StepBot } from '../components/types';

// Re-export types for convenience
export type { StepDefinition, StepTheme, StepBot };

interface StepsContextValue {
  steps: StepDefinition[];
  activeStep: number;
  documentId: string | undefined;
  setActiveStep: (index: number) => void;
  navigateToStep: (stepSlug: string) => void;
  navigateToStepByIndex: (index: number) => void;
  isInitialized: boolean;
}

// Create context with a default value to prevent undefined context issues
const defaultContextValue: StepsContextValue = {
  steps: steps,
  activeStep: 0,
  documentId: undefined,
  setActiveStep: () => {},
  navigateToStep: () => {},
  navigateToStepByIndex: () => {},
  isInitialized: true
};

const StepsContext = createContext<StepsContextValue>(defaultContextValue);

export const StepsProvider = ({ children }: { children: ReactNode }) => {
  const { stepSlug, documentId } = useParams<{ stepSlug?: string; documentId?: string }>();
  const navigate = useNavigate();
  
  // Find the active step based on URL slug
  const getActiveStepFromSlug = (slug?: string): number => {
    if (!slug) return 0;
    const stepIndex = steps.findIndex(step => step.slug === slug);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  const [activeStep, setActiveStepState] = useState(() => getActiveStepFromSlug(stepSlug));
  
  // Since steps data is static and available immediately, we can initialize as true
  // Only set to false if we're in a problematic state
  const [isInitialized, setIsInitialized] = useState(true);

  // Update active step when URL changes
  useEffect(() => {
    const newActiveStep = getActiveStepFromSlug(stepSlug);
    setActiveStepState(newActiveStep);
  }, [stepSlug]);

  const navigateToStep = (stepSlug: string) => {
    if (navigate) {
      navigate(getStepUrlBySlug(stepSlug, documentId));
    }
  };

  const navigateToStepByIndex = (index: number) => {
    if (index >= 0 && index < steps.length && navigate) {
      const step = steps[index];
      navigate(getStepUrl(step, documentId));
    }
  };

  const setActiveStep = (index: number) => {
    navigateToStepByIndex(index);
  };

  const value: StepsContextValue = {
    steps,
    activeStep,
    documentId,
    setActiveStep,
    navigateToStep,
    navigateToStepByIndex,
    isInitialized,
  };

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
};

export const useSteps = () => {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error('useSteps must be used within a StepsProvider');
  }
  return context;
}; 