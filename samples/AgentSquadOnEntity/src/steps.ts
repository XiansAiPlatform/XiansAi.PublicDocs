import React from 'react';

// Dynamic component imports
const componentRegistry = {
  'documentScope.tsx': () => import('./components/entity/documentScope').then(m => m.default),
  'representatives.tsx': () => import('./components/entity/representatives').then(m => m.default),
  'conditions.tsx': () => import('./components/entity/conditions').then(m => m.default),
  'witnesses.tsx': () => import('./components/entity/witnesses').then(m => m.default),
  'submitDocument.tsx': () => import('./components/entity/submitDocument').then(m => m.default),
};

export type ComponentLoader = () => Promise<React.ComponentType>;

export interface StepTheme {
  bg: string;
  bgLight: string;
  bgDark: string;
  text: string;
  border: string;
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

// Step definitions with component loaders
export const steps: StepDefinition[] = [
  {
    title: "Scope",
    theme: {
      bg: "bg-bot-requirements",
      bgLight: "bg-bot-requirements-light",
      bgDark: "bg-bot-requirements-dark",
      text: "text-bot-requirements-text",
      border: "border-bot-requirements-border"
    },
    entityUi: "documentScope.tsx",
    componentLoader: componentRegistry['documentScope.tsx']
  },
  {
    title: "Representatives",
    theme: {
      bg: "bg-bot-draft",
      bgLight: "bg-bot-draft-light",
      bgDark: "bg-bot-draft-dark",
      text: "text-bot-draft-text",
      border: "border-bot-draft-border"
    },
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
    theme: {
      bg: "bg-bot-review",
      bgLight: "bg-bot-review-light",
      bgDark: "bg-bot-review-dark",
      text: "text-bot-review-text",
      border: "border-bot-review-border"
    },
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
    theme: {
      bg: "bg-bot-review",
      bgLight: "bg-bot-review-light",
      bgDark: "bg-bot-review-dark",
      text: "text-bot-review-text",
      border: "border-bot-review-border"
    },
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
    theme: {
      bg: "bg-bot-finalize",
      bgLight: "bg-bot-finalize-light",
      bgDark: "bg-bot-finalize-dark",
      text: "text-bot-finalize-text",
      border: "border-bot-finalize-border"
    },
    entityUi: "submitDocument.tsx",
    componentLoader: componentRegistry['submitDocument.tsx']
  }
];

// Helper function to create component registry for different document types
export const createComponentRegistry = (components: Record<string, ComponentLoader>) => components;

export default steps; 