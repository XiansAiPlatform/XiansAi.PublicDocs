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
      agent: "Representative Bot",
      description: "Assist with managing the representatives",
      workflowType: "Power of Attorney Agent v2:Representative Bot",
      workflowId: "99x.io:Power of Attorney Agent v2:Representative Bot"
    },
    entityUi: "representatives.tsx",
    componentLoader: componentRegistry['representatives.tsx']
  },
  {
    title: "Conditions",
    theme: "lavender",
    bot: {
      title: "Conditions Agent",
      agent: "Condition Bot",
      id: "99x.io:Power of Attorney Agent v2:Condition Bot",
      description: "Assist people with Caring",
      workflowType: "Power of Attorney Agent v2:Condition Bot",
      workflowId: "99x.io:Power of Attorney Agent v2:Condition Bot"
    },
    entityUi: "conditions.tsx",
    componentLoader: componentRegistry['conditions.tsx']
  },
  {
    title: "Witnesses",
    theme: "blue",
    bot: {
      title: "Witnesses Agent",
      agent: "Witness Bot",
      id: "99x.io:Power of Attorney Agent v2:Witness Bot",
      description: "Assist people with Payments",
      workflowType: "Power of Attorney Agent v2:Witness Bot",
      workflowId: "99x.io:Power of Attorney Agent v2:Witness Bot"
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