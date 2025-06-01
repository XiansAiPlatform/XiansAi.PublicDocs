import React, { createContext, useContext, useState, ReactNode } from 'react';
import { steps, StepDefinition, StepTheme, StepBot } from '../components/power-of-attorney/steps';

// Re-export types for convenience
export type { StepDefinition, StepTheme, StepBot };

interface StepsContextValue {
  steps: StepDefinition[];
  activeStep: number;
  setActiveStep: (index: number) => void;
}

const StepsContext = createContext<StepsContextValue | undefined>(undefined);

export const StepsProvider = ({ children }: { children: ReactNode }) => {
  const [activeStep, setActiveStep] = useState(0);

  const value: StepsContextValue = {
    steps,
    activeStep,
    setActiveStep,
  };

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
};

export const useSteps = () => {
  const ctx = useContext(StepsContext);
  if (!ctx) {
    throw new Error('useSteps must be used within a StepsProvider');
  }
  return ctx;
}; 