import React from 'react';

export type ComponentLoader = () => Promise<React.ComponentType>;

export type StepTheme = string;

export interface StepThemeColors {
  bg: string;
  bgLight: string;
  bgDark: string;
  text: string;
  border: string;
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonPrimaryFocus: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;
  buttonSecondaryBorder: string;
}

export interface Agent {
  id: string;
  workflowId: string; // Unique identifier
  title: string;
  agent: string;
  description?: string;
  workflowType?: string;
}

export interface StepBot {
  title: string;
  id?: string;
  agent?: string;
  description?: string;
  workflowType?: string;
  workflowId?: string;
}

export interface StepDefinition {
  title: string;
  slug: string;
  theme: StepTheme;
  componentLoader?: ComponentLoader;
  botId?: string; // Reference to agent by id (preferred)
  botWorkflowId?: string; // Reference to agent by workflowId (backward compatibility)
  bot?: StepBot; // Keep for backward compatibility, but prefer botId
} 