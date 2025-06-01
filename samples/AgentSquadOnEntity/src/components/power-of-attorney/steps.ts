import React from 'react';

// Dynamic component imports
const componentRegistry = {
  'documentScope.tsx': () => import('./documentScope').then(m => m.default),
  'representatives.tsx': () => import('./representatives').then(m => m.default),
  'conditions.tsx': () => import('./conditions').then(m => m.default),
  'witnesses.tsx': () => import('./witnesses').then(m => m.default),
  'submitDocument.tsx': () => import('./submitDocument').then(m => m.default),
};

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
  entityUi?: string;
  componentLoader?: ComponentLoader;
  bot?: StepBot;
}

// Utility function to derive all colors from theme name
export const getThemeColors = (themeName: string): StepThemeColors => {
  // Extract the base theme name (remove bg- prefix if present)
  const baseTheme = themeName.replace('bg-', '');
  
  // Dynamically generate Tailwind classes based on theme name
  return {
    bg: `bg-${baseTheme}-600`,
    bgLight: `bg-${baseTheme}-50`,
    bgDark: `bg-${baseTheme}-800`,
    text: `text-${baseTheme}-900`,
    border: `border-${baseTheme}-200`,
    buttonPrimary: `bg-${baseTheme}-600`,
    buttonPrimaryHover: `hover:bg-${baseTheme}-700`,
    buttonPrimaryFocus: `focus:ring-${baseTheme}-500`,
    buttonSecondary: `bg-${baseTheme}-50`,
    buttonSecondaryHover: `hover:bg-${baseTheme}-100`,
    buttonSecondaryBorder: `border-${baseTheme}-200`
  };
};

// Step definitions with simplified theme names
export const steps: StepDefinition[] = [
  {
    title: "Scope",
    theme: "purple",
    entityUi: "documentScope.tsx",
    componentLoader: componentRegistry['documentScope.tsx']
  },
  {
    title: "Representatives",
    theme: "warm",
    bot: {
      title: "Representatives Agent",
      agent: "HR Agent v3",
      description: "Assist with employee Hiring",
      workflowType: "HR Agent v3:Hire Bot v3",
      workflowId: "99x.io:HR Agent v3:Hire Bot v3"
    },
    entityUi: "representatives.tsx",
    componentLoader: componentRegistry['representatives.tsx']
  },
  {
    title: "Conditions",
    theme: "lavender",
    bot: {
      title: "Conditions Agent",
      id: "99x.io:HR Agent v3:Care Bot v3:94d63e47-d2b1-4f00-9890-7c91a6b48212",
      agent: "HR Agent v3",
      description: "Assist people with Caring",
      workflowType: "HR Agent v3:Care Bot v3"
    },
    entityUi: "conditions.tsx",
    componentLoader: componentRegistry['conditions.tsx']
  },
  {
    title: "Witnesses",
    theme: "blue",
    bot: {
      title: "Witnesses Agent",
      id: "99x.io:HR Agent v3:Pay Bot v3",
      agent: "HR Agent v3",
      description: "Assist people with Payments",
      workflowType: "HR Agent v3:Pay Bot v3"
    },
    entityUi: "witnesses.tsx",
    componentLoader: componentRegistry['witnesses.tsx']
  },
  {
    title: "Submit",
    theme: "green",
    entityUi: "submitDocument.tsx",
    componentLoader: componentRegistry['submitDocument.tsx']
  }
];

// Helper function to create component registry for different document types
export const createComponentRegistry = (components: Record<string, ComponentLoader>) => components;

export default steps; 