import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { steps, getStepUrlBySlug, getStepUrl } from '../components/power-of-attorney/steps';
import { StepDefinition, StepTheme, StepBot } from '../components/power-of-attorney/types';

// Re-export types for convenience
export type { StepDefinition, StepTheme, StepBot };

interface StepsContextValue {
  steps: StepDefinition[];
  activeStep: number;
  setActiveStep: (index: number) => void;
  navigateToStep: (stepSlug: string) => void;
  navigateToStepByIndex: (index: number) => void;
  isInitialized: boolean;
}

// Create context with a default value to prevent undefined context issues
const defaultContextValue: StepsContextValue = {
  steps: steps,
  activeStep: 0,
  setActiveStep: () => {},
  navigateToStep: () => {},
  navigateToStepByIndex: () => {},
  isInitialized: true
};

const StepsContext = createContext<StepsContextValue>(defaultContextValue);

export const StepsProvider = ({ children }: { children: ReactNode }) => {
  const { stepSlug } = useParams<{ stepSlug?: string }>();
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
      navigate(getStepUrlBySlug(stepSlug));
    }
  };

  const navigateToStepByIndex = (index: number) => {
    if (index >= 0 && index < steps.length && navigate) {
      const step = steps[index];
      navigate(getStepUrl(step));
    }
  };

  const setActiveStep = (index: number) => {
    navigateToStepByIndex(index);
  };

  const value: StepsContextValue = {
    steps,
    activeStep,
    setActiveStep,
    navigateToStep,
    navigateToStepByIndex,
    isInitialized,
  };

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
};

export const useSteps = () => {
  const ctx = useContext(StepsContext);
  
  // Only warn if we somehow get an invalid state
  if (!ctx.isInitialized && ctx.steps.length === 0) {
    console.warn('useSteps called with invalid context state');
  }
  
  return ctx;
}; 