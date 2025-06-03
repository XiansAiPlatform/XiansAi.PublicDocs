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
  theme: StepTheme;
  componentLoader?: ComponentLoader;
  bot?: StepBot;
} 